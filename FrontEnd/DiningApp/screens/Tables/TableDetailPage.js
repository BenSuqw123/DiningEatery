import { useContext, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Image, Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Button, TextInput } from "react-native-paper";
import Apis, { authApis, endpoints } from "../../configs/Apis";
import { MyUserContext } from "../../configs/MyContext";
import Styles from "./TableDetailStyles";

// ── helpers ───────────────────────────────────────────────────────────────────
const pad = n => String(n).padStart(2, "0");
const fmt = v => {
    const d = new Date(v);
    return isNaN(d) ? "Chưa rõ" : d.toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
};
const fmtPrice = p => Number(p).toLocaleString("vi-VN", { style: "currency", currency: "VND" });
const fmtCd = s => s === null ? "" : `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
const toApiDate = d => {
    const off = -d.getTimezoneOffset(), sg = off >= 0 ? "+" : "-", a = Math.abs(off);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00${sg}${pad(Math.floor(a / 60))}:${pad(a % 60)}`;
};
const now0 = new Date();
const defaultTime = `${now0.getFullYear()}-${pad(now0.getMonth() + 1)}-${pad(now0.getDate())}T${pad(now0.getHours())}:${pad(now0.getMinutes())}`;

// ─────────────────────────────────────────────────────────────────────────────
const TableDetailPage = ({ route, navigation }) => {
    const { table } = route.params;
    const [user] = useContext(MyUserContext);

    const [bookedSlots, setBookedSlots] = useState([]);
    const [myBooking, setMyBooking] = useState(null);
    const [startTime, setStartTime] = useState(defaultTime);
    const [note, setNote] = useState("");
    const [isDining, setIsDining] = useState(false);
    const [dishes, setDishes] = useState([]);
    const [cart, setCart] = useState({});
    const [showModal, setShowModal] = useState(false);
    const [invoice, setInvoice] = useState(null);
    const [timeLeft, setTimeLeft] = useState(null);
    const [loading, setLoading] = useState(false);
    const [orderLoading, setOrderLoading] = useState(false);

    const timer = useRef(null);
    const invoiceRef = useRef(null);
    useEffect(() => { invoiceRef.current = invoice; }, [invoice]);
    useEffect(() => () => clearInterval(timer.current), []);

    // ── countdown — dùng lại khi restore ─────────────────────────────────────
    const startCountdown = (endTimeStr) => {
        clearInterval(timer.current);
        timer.current = setInterval(() => {
            const rem = Math.floor((new Date(endTimeStr) - Date.now()) / 1000);
            if (rem <= 0) {
                clearInterval(timer.current);
                setTimeLeft(0);
                setIsDining(false);
                setShowModal(false);
                navigation.replace("PaymentPage", { table, invoice: invoiceRef.current });
            } else {
                setTimeLeft(rem);
            }
        }, 1000);
    };

    // ── load data — fetch booking + invoice, tự restore isDining ─────────────
    const loadData = async () => {
        try {
            setLoading(true);
            const res = await Apis.get(endpoints.bookCheckin(table.id));
            const data = res.data.results ?? res.data;
            setBookedSlots(Array.isArray(data) ? data : []);

            const token = await AsyncStorage.getItem("token");
            if (!token || !user) return;

            // Lấy booking của user
            const res2 = await authApis(token).get(endpoints.bookCheckin(table.id));
            const data2 = res2.data.results ?? res2.data;
            const mine = (Array.isArray(data2) ? data2 : []).find(s => s.customer_id === user.id) ?? null;
            setMyBooking(mine);

            // Nếu có booking → fetch invoice chưa thanh toán
            if (mine) {
                try {
                    const res3 = await authApis(token).get(endpoints.invoices + `?table=${table.id}`);
                    const inv = res3.data.results ?? res3.data;
                    const found = (Array.isArray(inv) ? inv : []).find(i => !i.is_paid) ?? null;
                    setInvoice(found);

                    // Restore isDining: nếu đang trong khung giờ ăn → tự bật lại
                    const now = new Date();
                    const start = new Date(mine.start_time);
                    const end = new Date(mine.end_time);
                    if (now >= start && now < end) {
                        setIsDining(true);
                        startCountdown(mine.end_time);
                        // Load dishes sẵn để gọi món được luôn
                        if (!dishes.length) {
                            const rd = await Apis.get(endpoints.dishes);
                            const dd = rd.data.results ?? rd.data;
                            setDishes(Array.isArray(dd) ? dd : []);
                        }
                    }
                } catch { }
            }
        } catch (e) {
            console.warn(e);
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => { loadData(); }, []);

    // ── load danh sách món ────────────────────────────────────────────────────
    const loadDishes = async () => {
        try {
            const res = await Apis.get(endpoints.dishes);
            const data = res.data.results ?? res.data;
            setDishes(Array.isArray(data) ? data : []);
        } catch (e) { console.warn(e); }
    };

    // ── đặt bàn ───────────────────────────────────────────────────────────────
    const handleReserve = async () => {
        if (!user) {
            return Alert.alert("Cần đăng nhập", "Vui lòng đăng nhập để đặt bàn.", [
                { text: "Để sau", style: "cancel" },
                { text: "Đăng nhập", onPress: () => navigation.navigate("user") },
            ]);
        }
        const token = await AsyncStorage.getItem("token");
        const start = new Date(startTime);
        if (isNaN(start)) return Alert.alert("Thời gian không hợp lệ");
        if (start <= new Date()) return Alert.alert("Không thể đặt trong quá khứ");

        const end = new Date(start.getTime() + 7200000);
        const overlap = bookedSlots.some(s => {
            const a = new Date(s.start_time), b = new Date(s.end_time);
            return start < b && end > a;
        });
        if (overlap) return Alert.alert("Khung giờ này đã có người đặt");

        try {
            await authApis(token).post(endpoints.checkin(table.id), { start_time: toApiDate(start), note });
            Alert.alert("Đặt bàn thành công!");
            loadData();
        } catch (e) {
            Alert.alert("Lỗi", e.response?.data?.error ?? e.response?.data?.detail ?? "Không thể đặt bàn");
        }
    };

    // ── hủy bàn ───────────────────────────────────────────────────────────────
    const handleCancel = async () => {
        const token = await AsyncStorage.getItem("token");
        if (!token) return;
        Alert.alert("Hủy đặt bàn", "Bạn chắc chắn muốn hủy?", [
            { text: "Không", style: "cancel" },
            {
                text: "Hủy bàn", style: "destructive", onPress: async () => {
                    try {
                        await authApis(token).patch(endpoints.cancel(table.id));
                        setIsDining(false);
                        setInvoice(null);
                        clearInterval(timer.current);
                        loadData();
                    } catch (e) { Alert.alert("Lỗi", e.response?.data?.error ?? "Không thể hủy"); }
                }
            },
        ]);
    };

    // ── bắt đầu dùng bữa ─────────────────────────────────────────────────────
    const handleStartDining = async () => {
        const now = new Date();
        if (now < new Date(myBooking.start_time))
            return Alert.alert("Chưa đến giờ", `Bàn bắt đầu lúc ${fmt(myBooking.start_time)}`);
        if (now > new Date(myBooking.end_time))
            return Alert.alert("Hết giờ");

        if (!dishes.length) await loadDishes();
        setIsDining(true);
        startCountdown(myBooking.end_time);
    };

    // ── gọi món ───────────────────────────────────────────────────────────────
    const handleOrder = async () => {
        const token = await AsyncStorage.getItem("token");
        if (!token) return;
        if (new Date() > new Date(myBooking?.end_time))
            return Alert.alert("Hết giờ", "Không thể gọi món sau thời gian sử dụng bàn");
        try {
            setOrderLoading(true);
            let last = null;
            for (const [dish_id, quantity] of Object.entries(cart)) {
                const res = await authApis(token).post(endpoints.order(table.id), { dish_id: Number(dish_id), quantity });
                last = res.data;
            }
            setInvoice(last);
            setCart({});
            setShowModal(false);
            Alert.alert("Đã gọi món!");
        } catch (e) {
            Alert.alert("Lỗi", e.response?.data?.error ?? "Không thể gọi món");
        } finally { setOrderLoading(false); }
    };

    const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);
    const cartTotal = Object.entries(cart).reduce((s, [id, q]) =>
        s + (dishes.find(d => String(d.id) === id)?.price ?? 0) * q, 0);
    const adjust = (id, d) => setCart(p => {
        const q = (p[id] ?? 0) + d;
        if (q <= 0) { const n = { ...p }; delete n[id]; return n; }
        return { ...p, [id]: q };
    });

    if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" />;

    return (
        <ScrollView style={Styles.screen}>

            <Text style={Styles.pageTitle}>{table.code || `Bàn #${table.id}`}</Text>

            {/* Thông tin bàn */}
            <View style={Styles.card}>
                <Text>Vị trí: {table.location || "Chưa cập nhật"}</Text>
                <Text>Sức chứa: {table.capacity || 0} người</Text>
                <Text>Trạng thái: {table.status}</Text>
            </View>

            {/* Khung giờ đã đặt */}
            <View style={Styles.card}>
                <Text style={Styles.cardTitle}>Khung giờ đã đặt</Text>
                {bookedSlots.length === 0
                    ? <Text style={Styles.emptyText}>Chưa có.</Text>
                    : bookedSlots.map((s, i) => <Text key={i}>{fmt(s.start_time)} – {fmt(s.end_time)}</Text>)
                }
            </View>

            {/* Form đặt bàn */}
            {!myBooking && (
                <View style={Styles.card}>
                    <Text style={Styles.cardTitle}>Đặt bàn</Text>
                    <TextInput label="Thời gian (YYYY-MM-DDTHH:mm)" value={startTime} onChangeText={setStartTime} mode="outlined" style={{ marginBottom: 8 }} />
                    <TextInput label="Ghi chú" value={note} onChangeText={setNote} mode="outlined" multiline style={{ marginBottom: 8 }} />
                    <Button mode="contained" onPress={handleReserve}>
                        {user ? "Đặt bàn" : "Đăng nhập để đặt bàn"}
                    </Button>
                </View>
            )}

            {/* Panel booking */}
            {!!myBooking && (
                <View style={Styles.card}>
                    <Text style={Styles.cardTitle}>Lịch đặt của bạn</Text>
                    <Text style={{ marginBottom: 8 }}>{fmt(myBooking.start_time)} – {fmt(myBooking.end_time)}</Text>

                    {isDining && timeLeft !== null && (
                        <View style={Styles.countdown}>
                            <Text style={Styles.cdLabel}>Thời gian còn lại</Text>
                            <Text style={[Styles.cdTime, timeLeft < 300 && Styles.cdTimeUrgent]}>
                                {fmtCd(timeLeft)}
                            </Text>
                        </View>
                    )}

                    {!isDining &&
                        <Button mode="contained" onPress={handleStartDining} style={{ marginBottom: 8 }} buttonColor="#1565C0">
                            Bắt đầu dùng bữa
                        </Button>
                    }
                    {isDining &&
                        <Button mode="contained" onPress={() => setShowModal(true)} style={{ marginBottom: 8 }} buttonColor="#F57F17">
                            Gọi món{cartCount > 0 ? ` (${cartCount})` : ""}
                        </Button>
                    }

                    {!!invoice && (
                        <View style={Styles.invoiceBox}>
                            <Text style={Styles.invoiceTitle}>Hoá đơn tạm</Text>
                            {(invoice.details ?? []).map((d, i) => (
                                <Text key={i}>{d.dish_name ?? `Món #${d.dish}`} × {d.quantity} — {fmtPrice((d.unit_price ?? 0) * d.quantity)}</Text>
                            ))}
                            <Text style={Styles.invoiceTotal}>Tổng: {fmtPrice(invoice.total_amount ?? 0)}</Text>
                        </View>
                    )}

                    {!isDining
                        ? <Button mode="contained" onPress={handleCancel} buttonColor="#c2410c">Hủy đặt bàn</Button>
                        : <Button mode="contained" onPress={() => navigation.navigate("PaymentPage", { table, invoice })} buttonColor="#6A1B9A">Thanh toán</Button>
                    }
                </View>
            )}

            <Button onPress={() => navigation.goBack()} style={{ marginTop: 8 }}>Quay lại</Button>

            {/* Modal chọn món */}
            <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowModal(false)}>
                <View style={Styles.modalContainer}>
                    <View style={Styles.modalHeader}>
                        <Text style={Styles.modalTitle}>Chọn món ăn</Text>
                        <TouchableOpacity onPress={() => setShowModal(false)}>
                            <Text style={{ fontSize: 16 }}>✕ Đóng</Text>
                        </TouchableOpacity>
                    </View>

                    <FlatList
                        data={dishes}
                        keyExtractor={d => String(d.id)}
                        contentContainerStyle={Styles.modalList}
                        renderItem={({ item }) => (
                            <View style={Styles.dishItem}>
                                {!!item.image && <Image source={{ uri: item.image }} style={Styles.dishImage} />}
                                <View style={Styles.dishInfo}>
                                    <Text style={Styles.dishName}>{item.name}</Text>
                                    <Text style={Styles.dishPrice}>{fmtPrice(item.price)}</Text>
                                </View>
                                <View style={Styles.stepper}>
                                    <TouchableOpacity onPress={() => adjust(item.id, -1)} style={Styles.stepBtn}>
                                        <Text style={Styles.stepBtnTxt}>−</Text>
                                    </TouchableOpacity>
                                    <Text style={Styles.stepQty}>{cart[item.id] ?? 0}</Text>
                                    <TouchableOpacity onPress={() => adjust(item.id, 1)} style={Styles.stepBtn}>
                                        <Text style={Styles.stepBtnTxt}>+</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    />

                    <View style={Styles.modalFooter}>
                        {cartCount > 0 && <Text style={Styles.modalCartText}>{cartCount} món · {fmtPrice(cartTotal)}</Text>}
                        <Button mode="contained" onPress={handleOrder} loading={orderLoading}
                            disabled={orderLoading || cartCount === 0}
                            buttonColor={cartCount === 0 ? "#aaa" : "#2E7D52"}
                            style={{ width: "100%" }}>
                            Xác nhận gọi món
                        </Button>
                    </View>
                </View>
            </Modal>

        </ScrollView>
    );
};

export default TableDetailPage;
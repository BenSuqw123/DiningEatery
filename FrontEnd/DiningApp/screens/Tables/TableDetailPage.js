import { useContext, useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Apis, { authApis, endpoints } from "../../configs/Apis";
import { MyUserContext } from "../../configs/MyContext";

const pad = n => String(n).padStart(2, "0");

const getDefaultStartTime = () => {
    const d = new Date(Date.now() + 60 * 60 * 1000);
    d.setMinutes(0, 0, 0);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const parseDate = value => {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
};

const addHours = (date, hours) => new Date(date.getTime() + hours * 60 * 60 * 1000);

const formatApiDate = date => {
    const offset = -date.getTimezoneOffset();
    const sign = offset >= 0 ? "+" : "-";
    const abs = Math.abs(offset);
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:00${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
};

const formatTime = value => {
    const d = typeof value === "string" ? parseDate(value) : value;
    if (!d) return "Chưa rõ";
    return d.toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
};

const TableDetailPage = ({ route, navigation }) => {
    const { table } = route.params;
    const [user] = useContext(MyUserContext);

    const [currentTable, setCurrentTable] = useState(table);
    const [bookedSlots, setBookedSlots] = useState([]);
    const [bookCheckin, setBookCheckin] = useState(null);
    const [startTime, setStartTime] = useState(getDefaultStartTime());
    const [note, setNote] = useState("");
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState("");
    const [timeError, setTimeError] = useState("");

    const startDate = parseDate(startTime);
    const endDate = startDate ? addHours(startDate, 2) : null;
    const isMyBooking = !!bookCheckin;

    const loadBookedTimes = async () => {
        try {
            const res = await Apis.get(endpoints.booked_times(currentTable.id));
            setBookedSlots(res.data.results || res.data);
        } catch (err) {
            console.log(err.response?.data || err.message);
        }
    };

    const loadBookCheckin = async () => {
        try {
            const token = await AsyncStorage.getItem("token");
            if (!token) return setBookCheckin(null);
            const res = await authApis(token).get(endpoints.bookCheckin(currentTable.id));
            setBookCheckin(res.data);
        } catch (err) {
            setBookCheckin(null);
        }
    };

    const loadData = async () => {
        setLoading(true);
        await loadBookedTimes();
        await loadBookCheckin();
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, [currentTable.id]);

    const requireLogin = async () => {
        const token = await AsyncStorage.getItem("token");
        if (token && user) return token;

        Alert.alert("Cần đăng nhập", "Vui lòng đăng nhập để tiếp tục.", [
            { text: "Để sau", style: "cancel" },
            { text: "Đăng nhập", onPress: () => navigation.getParent?.()?.navigate("user", { screen: "login" }) },
        ]);

        return null;
    };

    const isOverlap = () => {
        if (!startDate || !endDate) return false;

        return bookedSlots.some(slot => {
            const slotStart = parseDate(slot.start_time);
            const slotEnd = parseDate(slot.end_time);
            if (!slotStart || !slotEnd) return false;
            return startDate < slotEnd && endDate > slotStart;
        });
    };

    const handleReserve = async () => {
        const token = await requireLogin();
        if (!token) return;

        setError("");
        setTimeError("");

        if (!startDate) return setTimeError("Vui lòng nhập thời gian hợp lệ.");
        if (startDate <= new Date()) return setTimeError("Không thể đặt thời gian trong quá khứ.");
        if (isOverlap()) return setTimeError("Khung giờ này đã được đặt. Vui lòng chọn giờ khác.");

        try {
            setActionLoading(true);
            await authApis(token).post(endpoints.checkin(currentTable.id), { start_time: formatApiDate(startDate), note });
            setCurrentTable({ ...currentTable, status: "BOOKED" });
            Alert.alert("Thành công", "Đặt bàn thành công!");
            await loadData();
        } catch (err) {
            setError(err.response?.data?.error || err.response?.data?.detail || "Không thể đặt bàn.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleCancel = async () => {
        const token = await requireLogin();
        if (!token) return;

        Alert.alert("Hủy đặt bàn", "Bạn chắc chắn muốn hủy đặt bàn này?", [
            { text: "Không", style: "cancel" },
            {
                text: "Hủy bàn",
                style: "destructive",
                onPress: async () => {
                    try {
                        setActionLoading(true);
                        await authApis(token).patch(endpoints.cancel(currentTable.id));
                        setCurrentTable({ ...currentTable, status: "AVAILABLE" });
                        Alert.alert("Thành công", "Đã hủy đặt bàn.");
                        await loadData();
                    } catch (err) {
                        setError(err.response?.data?.error || err.response?.data?.detail || "Không thể hủy bàn.");
                    } finally {
                        setActionLoading(false);
                    }
                },
            },
        ]);
    };

    if (loading) return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator size="large" />
            <Text>Đang tải chi tiết bàn...</Text>
        </View>
    );

    return (
        <ScrollView style={{ flex: 1, backgroundColor: "#f7f5f2" }} contentContainerStyle={{ padding: 16, paddingTop: 50 }}>
            <Text style={{ fontSize: 24, fontWeight: "700", marginBottom: 8 }}>{currentTable.code || `Bàn #${currentTable.id}`}</Text>

            <View style={{ backgroundColor: "#fff", borderRadius: 10, padding: 14, marginBottom: 12 }}>
                <Text>Vị trí: {currentTable.location || "Chưa cập nhật"}</Text>
                <Text>Sức chứa: {currentTable.capacity || 0} người</Text>
                <Text>Trạng thái: {currentTable.status}</Text>
            </View>

            {!!error && <Text style={{ color: "red", marginBottom: 10 }}>{error}</Text>}

            <View style={{ backgroundColor: "#fff", borderRadius: 10, padding: 14, marginBottom: 12 }}>
                <Text style={{ fontSize: 16, fontWeight: "700", marginBottom: 8 }}>Khung giờ đã đặt</Text>
                {bookedSlots.length === 0 ? <Text>Chưa có khung giờ nào.</Text> : bookedSlots.map((slot, index) => (
                    <Text key={index}>{formatTime(slot.start_time)} - {formatTime(slot.end_time)}</Text>
                ))}
            </View>

            {!isMyBooking && (
                <View style={{ backgroundColor: "#fff", borderRadius: 10, padding: 14, marginBottom: 12 }}>
                    <Text style={{ fontSize: 16, fontWeight: "700", marginBottom: 10 }}>Đặt bàn</Text>

                    <Text>Thời gian bắt đầu</Text>
                    <TextInput value={startTime} onChangeText={value => { setStartTime(value); setTimeError(""); }} placeholder="YYYY-MM-DDTHH:mm" style={{ borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 10, marginBottom: 6 }} />

                    {!!timeError && <Text style={{ color: "red", marginBottom: 8 }}>{timeError}</Text>}
                    <Text style={{ marginBottom: 10 }}>Kết thúc: {endDate ? formatTime(endDate) : "Tự động +2 tiếng"}</Text>

                    <Text>Ghi chú</Text>
                    <TextInput value={note} onChangeText={setNote} placeholder="Ghi chú nếu có" multiline style={{ borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 10, minHeight: 70, marginBottom: 12 }} />

                    <TouchableOpacity onPress={handleReserve} disabled={actionLoading} style={{ backgroundColor: "#2E7D52", borderRadius: 8, padding: 12, alignItems: "center" }}>
                        <Text style={{ color: "#fff", fontWeight: "700" }}>{actionLoading ? "Đang xử lý..." : "Đặt bàn"}</Text>
                    </TouchableOpacity>
                </View>
            )}

            {isMyBooking && (
                <TouchableOpacity onPress={handleCancel} disabled={actionLoading} style={{ backgroundColor: "#c2410c", borderRadius: 8, padding: 12, alignItems: "center", marginBottom: 12 }}>
                    <Text style={{ color: "#fff", fontWeight: "700" }}>Hủy đặt bàn của tôi</Text>
                </TouchableOpacity>
            )}

            <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 12, alignItems: "center" }}>
                <Text>Quay lại</Text>
            </TouchableOpacity>
        </ScrollView>
    );
};

export default TableDetailPage;
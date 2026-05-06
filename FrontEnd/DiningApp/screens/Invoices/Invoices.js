import { useContext, useEffect, useState } from "react";
import {
    View, Text, FlatList, TouchableOpacity,
    Modal, StyleSheet, ActivityIndicator
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { MyUserContext } from "../../configs/MyContext";
import { authApis, endpoints } from "../../configs/Apis";
import AsyncStorage from "@react-native-async-storage/async-storage";

const METHOD_LABEL = {
    CASH:    { label: "Tiền mặt",  icon: "cash-outline" },
    MOMO:    { label: "MoMo",      icon: "phone-portrait-outline" },
    STRIPE:  { label: "Stripe",    icon: "card-outline" },
    PAYPAL:  { label: "PayPal",    icon: "logo-paypal" },
    ZALOPAY: { label: "ZaloPay",   icon: "wallet-outline" },
};

const Invoices = () => {
    const [user] = useContext(MyUserContext);
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState(null);

    useEffect(() => {
        if (user) loadInvoices();
    }, [user]);

    const loadInvoices = async () => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem("token");
            const res = await authApis(token).get(endpoints["invoices"]);
            setInvoices(res.data.results ?? res.data);
        } catch (ex) {
            console.error(ex);
        } finally {
            setLoading(false);
        }
    };

    // ── Chưa đăng nhập ────────────────────────────────────────────
    if (!user) return (
        <View style={s.center}>
            <Ionicons name="receipt-outline" size={52} color="#cbd5e1" />
            <Text style={s.emptyText}>Đăng nhập để xem hóa đơn</Text>
        </View>
    );

    // ── Đang load ─────────────────────────────────────────────────
    if (loading) return (
        <View style={s.center}>
            <ActivityIndicator size="large" color="#0ea5e9" />
        </View>
    );

    // ── Không có hóa đơn ──────────────────────────────────────────
    if (invoices.length === 0) return (
        <View style={s.center}>
            <Ionicons name="receipt-outline" size={52} color="#cbd5e1" />
            <Text style={s.emptyText}>Bạn chưa có hóa đơn nào</Text>
        </View>
    );

    return (
        <View style={s.container}>
            <Text style={s.heading}>Hóa đơn của tôi</Text>

            <FlatList
                data={invoices}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={{ paddingBottom: 24 }}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                    <TouchableOpacity style={s.card} onPress={() => setSelected(item)}>
                        <View style={s.cardLeft}>
                            <Text style={s.cardId}>Hóa đơn #{item.id}</Text>
                            <Text style={s.cardDate}>
                                {new Date(item.created_at).toLocaleDateString("vi-VN")}
                            </Text>
                            <Text style={s.cardItems}>
                                {item.details.length} món
                            </Text>
                        </View>
                        <View style={s.cardRight}>
                            <Text style={s.cardAmount}>
                                {parseInt(item.total_amount).toLocaleString("vi-VN")}đ
                            </Text>
                            <View style={[s.badge, item.is_paid ? s.badgePaid : s.badgeUnpaid]}>
                                <Text style={[s.badgeText, { color: item.is_paid ? "#16a34a" : "#dc2626" }]}>
                                    {item.is_paid ? "Đã thanh toán" : "Chưa thanh toán"}
                                </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={16} color="#94a3b8" style={{ marginTop: 6 }} />
                        </View>
                    </TouchableOpacity>
                )}
            />

            {/* ── Modal chi tiết ────────────────────────────────── */}
            <Modal
                visible={!!selected}
                animationType="slide"
                transparent
                onRequestClose={() => setSelected(null)}
            >
                <View style={s.overlay}>
                    <View style={s.modal}>
                        {/* Header */}
                        <View style={s.modalHeader}>
                            <Text style={s.modalTitle}>Chi tiết hóa đơn #{selected?.id}</Text>
                            <TouchableOpacity onPress={() => setSelected(null)}>
                                <Ionicons name="close-circle" size={28} color="#94a3b8" />
                            </TouchableOpacity>
                        </View>

                        {/* Ngày */}
                        <View style={s.metaRow}>
                            <Ionicons name="calendar-outline" size={16} color="#94a3b8" />
                            <Text style={s.metaText}>
                                {selected && new Date(selected.created_at).toLocaleString("vi-VN")}
                            </Text>
                        </View>

                        {/* Danh sách món */}
                        <Text style={s.sectionLabel}>Danh sách món</Text>
                        {selected?.details.map((d, idx) => (
                            <View key={d.id} style={s.detailRow}>
                                <Text style={s.detailIndex}>{idx + 1}</Text>
                                <Text style={s.detailName}>{d.dish_name}</Text>
                                <Text style={s.detailQty}>x{d.quantity}</Text>
                            </View>
                        ))}

                        <View style={s.divider} />

                        {/* Tổng tiền */}
                        <View style={s.totalRow}>
                            <Text style={s.totalLabel}>Tổng cộng</Text>
                            <Text style={s.totalAmount}>
                                {selected && parseInt(selected.total_amount).toLocaleString("vi-VN")}đ
                            </Text>
                        </View>

                        {/* Thanh toán */}
                        {selected?.is_paid && (
                            <View style={s.paymentBox}>
                                <Ionicons
                                    name={METHOD_LABEL[selected.method]?.icon ?? "card-outline"}
                                    size={18} color="#16a34a"
                                />
                                <Text style={s.paymentMethod}>
                                    {METHOD_LABEL[selected.method]?.label ?? selected.method}
                                </Text>
                                {selected.transaction_id && (
                                    <Text style={s.txId} numberOfLines={1}>
                                        #{selected.transaction_id}
                                    </Text>
                                )}
                            </View>
                        )}

                        <View style={[s.badge,
                            selected?.is_paid ? s.badgePaid : s.badgeUnpaid,
                            { alignSelf: "center", marginTop: 12, paddingHorizontal: 20, paddingVertical: 8 }
                        ]}>
                            <Text style={[s.badgeText, { color: selected?.is_paid ? "#16a34a" : "#dc2626", fontSize: 14 }]}>
                                {selected?.is_paid ? "✓ Đã thanh toán" : "✗ Chưa thanh toán"}
                            </Text>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f8fafc", paddingHorizontal: 16, paddingTop: 16 },
    center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
    emptyText: { fontSize: 15, color: "#94a3b8" },
    heading: { fontSize: 22, fontWeight: "800", color: "#0f172a", marginBottom: 16 },

    // Card
    card: {
        backgroundColor: "#fff", borderRadius: 16, padding: 16,
        flexDirection: "row", justifyContent: "space-between", alignItems: "center",
        marginBottom: 12, elevation: 2,
    },
    cardLeft: { gap: 4 },
    cardId: { fontSize: 15, fontWeight: "700", color: "#0f172a" },
    cardDate: { fontSize: 13, color: "#94a3b8" },
    cardItems: { fontSize: 13, color: "#64748b" },
    cardRight: { alignItems: "flex-end", gap: 4 },
    cardAmount: { fontSize: 16, fontWeight: "800", color: "#0ea5e9" },

    // Badge
    badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
    badgePaid: { backgroundColor: "#dcfce7" },
    badgeUnpaid: { backgroundColor: "#fee2e2" },
    badgeText: { fontSize: 12, fontWeight: "600" },

    // Modal
    overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
    modal: {
        backgroundColor: "#fff", borderTopLeftRadius: 28, borderTopRightRadius: 28,
        padding: 24, paddingBottom: 40,
    },
    modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
    modalTitle: { fontSize: 18, fontWeight: "800", color: "#0f172a" },
    metaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 16 },
    metaText: { fontSize: 13, color: "#94a3b8" },
    sectionLabel: { fontSize: 13, fontWeight: "700", color: "#94a3b8", marginBottom: 10, letterSpacing: 0.5 },
    detailRow: {
        flexDirection: "row", alignItems: "center",
        paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#f1f5f9",
    },
    detailIndex: { width: 24, fontSize: 13, color: "#94a3b8", fontWeight: "600" },
    detailName: { flex: 1, fontSize: 14, color: "#1e293b", fontWeight: "500" },
    detailQty: { fontSize: 14, color: "#0ea5e9", fontWeight: "700" },
    divider: { height: 1, backgroundColor: "#e2e8f0", marginVertical: 14 },
    totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    totalLabel: { fontSize: 15, fontWeight: "600", color: "#64748b" },
    totalAmount: { fontSize: 20, fontWeight: "800", color: "#0f172a" },
    paymentBox: {
        flexDirection: "row", alignItems: "center", gap: 8,
        backgroundColor: "#f0fdf4", borderRadius: 12, padding: 12, marginTop: 12,
    },
    paymentMethod: { fontSize: 14, fontWeight: "700", color: "#16a34a", flex: 1 },
    txId: { fontSize: 12, color: "#94a3b8", maxWidth: 120 },
});

export default Invoices;
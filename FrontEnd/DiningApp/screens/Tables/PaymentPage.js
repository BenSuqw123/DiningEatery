import { useContext, useState } from "react";
import { Alert, Image, ScrollView, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Button, RadioButton, TextInput } from "react-native-paper";
import { authApis, endpoints } from "../../configs/Apis";
import { MyUserContext } from "../../configs/MyContext";

// ── Thông tin sandbox từng cổng ───────────────────────────────────────────────
const METHODS = [
    {
        key: "MOMO",
        label: "MoMo",
        color: "#ae2070",
        logo: "https://upload.wikimedia.org/wikipedia/vi/f/fe/MoMo_Logo.png",
        sandbox: [
            { label: "Số điện thoại", value: "0909000111" },
            { label: "Mật khẩu", value: "000000" },
            { label: "OTP", value: "000000" },
        ],
        note: "Dùng tài khoản test MoMo Sandbox. Nhập mã giao dịch sau khi thanh toán thành công.",
    },
    {
        key: "VNPAY",
        label: "VNPay",
        color: "#005baa",
        logo: "https://cdn.haitrieu.com/wp-content/uploads/2022/10/Icon-VNPAY-QR.png",
        sandbox: [
            { label: "Ngân hàng", value: "NCB" },
            { label: "Số thẻ", value: "9704198526191432198" },
            { label: "Tên chủ thẻ", value: "NGUYEN VAN A" },
            { label: "Ngày phát hành", value: "07/15" },
            { label: "OTP", value: "123456" },
        ],
        note: "Dùng thẻ test VNPay Sandbox (NCB). Nhập mã giao dịch sau khi thanh toán.",
    },
    {
        key: "STRIPE",
        label: "Stripe",
        color: "#635bff",
        logo: "https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg",
        sandbox: [
            { label: "Số thẻ", value: "4242 4242 4242 4242" },
            { label: "Ngày hết hạn", value: "12/34" },
            { label: "CVC", value: "123" },
            { label: "ZIP", value: "10001" },
        ],
        note: "Dùng thẻ test Stripe. Mọi thẻ Visa/Master đều được chấp nhận ở Sandbox.",
    },
    {
        key: "CASH",
        label: "Tiền mặt",
        color: "#2E7D52",
        logo: null,
        sandbox: [],
        note: "Thanh toán trực tiếp tại quầy. Không cần mã giao dịch.",
    },
];

const fmtPrice = p => Number(p).toLocaleString("vi-VN", { style: "currency", currency: "VND" });

// ─────────────────────────────────────────────────────────────────────────────
const PaymentPage = ({ route, navigation }) => {
    const { table, invoice } = route.params;
    const [user] = useContext(MyUserContext);

    const [method, setMethod] = useState("MOMO");
    const [transaction, setTransaction] = useState("");
    const [loading, setLoading] = useState(false);

    const selected = METHODS.find(m => m.key === method);
    const total = invoice?.total_amount ?? 0;

    const handleCheckout = async () => {
        if (!invoice) return Alert.alert("Lỗi", "Không có hoá đơn.");

        if (method !== "CASH" && !transaction.trim())
            return Alert.alert("Thiếu mã giao dịch", "Vui lòng nhập mã giao dịch sau khi thanh toán.");

        const token = await AsyncStorage.getItem("token");
        if (!token) return Alert.alert("Cần đăng nhập");

        try {
            setLoading(true);
            await authApis(token).post(endpoints.checkout(table.id), {
                method,
                transaction: method !== "CASH" ? transaction.trim() : undefined,
            });
            Alert.alert("Thanh toán thành công!", `Cảm ơn bạn đã sử dụng dịch vụ.`, [
                { text: "OK", onPress: () => navigation.reset({ index: 0, routes: [{ name: "home" }] }) },
            ]);
        } catch (e) {
            Alert.alert("Lỗi", e.response?.data?.error ?? e.response?.data?.detail ?? "Không thể thanh toán.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.screen}>
            <Text style={styles.pageTitle}>Thanh toán</Text>

            {/* Tóm tắt hoá đơn */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Hoá đơn</Text>
                <Text>Bàn: {table.code || `#${table.id}`}</Text>
                {(invoice?.details ?? []).map((d, i) => (
                    <Text key={i} style={{ marginTop: 4 }}>
                        {d.dish_name ?? `Món #${d.dish}`} × {d.quantity}
                        {"  "}{fmtPrice((d.unit_price ?? 0) * d.quantity)}
                    </Text>
                ))}
                <Text style={styles.totalText}>Tổng cộng: {fmtPrice(total)}</Text>
            </View>

            {/* Chọn phương thức */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Phương thức thanh toán</Text>
                <RadioButton.Group onValueChange={v => { setMethod(v); setTransaction(""); }} value={method}>
                    {METHODS.map(m => (
                        <RadioButton.Item
                            key={m.key}
                            label={m.label}
                            value={m.key}
                            color={m.color}
                            style={{ paddingVertical: 4 }}
                        />
                    ))}
                </RadioButton.Group>
            </View>

            {/* Thông tin sandbox */}
            {selected && (
                <View style={[styles.card, { borderLeftWidth: 4, borderLeftColor: selected.color }]}>
                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10, gap: 10 }}>
                        {selected.logo && (
                            <Image source={{ uri: selected.logo }} style={{ width: 40, height: 40, resizeMode: "contain" }} />
                        )}
                        <Text style={[styles.cardTitle, { marginBottom: 0, color: selected.color }]}>
                            {selected.label} — Thông tin Sandbox
                        </Text>
                    </View>

                    {selected.sandbox.map((s, i) => (
                        <View key={i} style={styles.sandboxRow}>
                            <Text style={styles.sandboxLabel}>{s.label}</Text>
                            <Text style={styles.sandboxValue}>{s.value}</Text>
                        </View>
                    ))}

                    <Text style={styles.sandboxNote}>{selected.note}</Text>
                </View>
            )}

            {/* Nhập mã giao dịch (ẩn với CASH) */}
            {method !== "CASH" && (
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Mã giao dịch</Text>
                    <TextInput
                        label="Nhập mã giao dịch sau khi thanh toán"
                        value={transaction}
                        onChangeText={setTransaction}
                        mode="outlined"
                        style={{ marginBottom: 4 }}
                    />
                    <Text style={{ color: "#888", fontSize: 12 }}>
                        Sao chép mã từ ứng dụng {selected?.label} sau khi giao dịch thành công rồi dán vào đây.
                    </Text>
                </View>
            )}

            {/* Nút xác nhận */}
            <Button
                mode="contained"
                onPress={handleCheckout}
                loading={loading}
                disabled={loading}
                buttonColor="#6A1B9A"
                style={{ margin: 16 }}
                contentStyle={{ paddingVertical: 6 }}
                labelStyle={{ fontSize: 16 }}
            >
                Xác nhận thanh toán {fmtPrice(total)}
            </Button>

            <Button onPress={() => navigation.goBack()} style={{ marginBottom: 24 }}>
                Quay lại
            </Button>
        </ScrollView>
    );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = {
    screen: { flex: 1, backgroundColor: "#f7f5f2", padding: 16, paddingTop: 50 },
    pageTitle: { fontSize: 22, fontWeight: "700", marginBottom: 12 },
    card: { backgroundColor: "#fff", borderRadius: 10, padding: 14, marginBottom: 12 },
    cardTitle: { fontSize: 16, fontWeight: "700", marginBottom: 8 },
    totalText: { fontWeight: "700", fontSize: 16, marginTop: 10, color: "#2E7D52" },
    sandboxRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
    sandboxLabel: { color: "#666", fontSize: 13 },
    sandboxValue: { fontWeight: "700", fontSize: 13, fontFamily: "monospace" },
    sandboxNote: { marginTop: 10, color: "#888", fontSize: 12, fontStyle: "italic" },
};

export default PaymentPage;
import { TouchableOpacity, Text, View } from "react-native";

const STATUS_CONFIG = {
    AVAILABLE: { label: "Trống", color: "#2E7D52", bg: "#EAF3DE" },
    BOOKED: { label: "Đã đặt", color: "#B97716", bg: "#FFF1CC" },
    OCCUPIED: { label: "Đang dùng", color: "#B94A2C", bg: "#F8DDD4" },
};

const TableCard = ({ table, onPress }) => {
    const status = STATUS_CONFIG[table.status] ?? STATUS_CONFIG.AVAILABLE;

    return (
        <TouchableOpacity
            onPress={onPress}
            style={{
                width: "48%",
                backgroundColor: "#fff",
                borderRadius: 10,
                padding: 12,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: status.color,
            }}
        >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <Text style={{ fontSize: 16, fontWeight: "700", flex: 1 }}>
                    {table.code || `Bàn #${table.id}`}
                </Text>
                <View style={{ backgroundColor: status.bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 }}>
                    <Text style={{ color: status.color, fontSize: 11, fontWeight: "700" }}>
                        {status.label}
                    </Text>
                </View>
            </View>

            <Text style={{ marginTop: 10, color: "#666", fontSize: 13 }}>
                Vị trí: {table.location || "Chưa cập nhật"}
            </Text>
            <Text style={{ marginTop: 4, color: "#666", fontSize: 13 }}>
                Sức chứa: {table.capacity || 0} người
            </Text>
        </TouchableOpacity>
    );
};

export default TableCard;

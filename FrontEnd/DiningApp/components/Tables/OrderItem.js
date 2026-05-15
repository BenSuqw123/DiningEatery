import { Text, TouchableOpacity, View } from "react-native";

const formatPrice = (price) => `${Number(price || 0).toLocaleString("vi-VN")}đ`;

const OrderItem = ({ item, quantity = 0, onDecrease, onIncrease }) => (
    <View
        style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingVertical: 10,
            borderBottomWidth: 1,
            borderBottomColor: "#eee",
            gap: 10,
        }}
    >
        <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: "600", color: "#222" }}>
                {item.name || item.dish_name}
            </Text>
            <Text style={{ fontSize: 13, color: "#777", marginTop: 3 }}>
                {formatPrice(item.price)}
            </Text>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <TouchableOpacity
                onPress={onDecrease}
                disabled={quantity === 0}
                style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: quantity === 0 ? "#ccc" : "#333",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <Text style={{ color: "#fff", fontWeight: "700", fontSize: 18 }}>-</Text>
            </TouchableOpacity>

            <Text style={{ minWidth: 20, textAlign: "center", fontWeight: "700" }}>
                {quantity}
            </Text>

            <TouchableOpacity
                onPress={onIncrease}
                style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: "#333",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <Text style={{ color: "#fff", fontWeight: "700", fontSize: 18 }}>+</Text>
            </TouchableOpacity>
        </View>
    </View>
);

export default OrderItem;

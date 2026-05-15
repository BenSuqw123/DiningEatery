import { useContext, useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, Modal, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { MyUserContext } from "../../configs/MyContext";
import { authApis, endpoints } from "../../configs/Apis";
import AsyncStorage from "@react-native-async-storage/async-storage";

const Invoices = () => {
    const [user] = useContext(MyUserContext);
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState(null);

    useEffect(() => { if (user) loadInvoices(); }, [user]);

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

    if (!user || loading || invoices.length === 0)
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                {loading
                    ? <ActivityIndicator size="large" />
                    : <Text>{!user ? "Đăng nhập để xem hóa đơn" : "Chưa có hóa đơn"}</Text>
                }
            </View>
        );

    return (
        <View style={{ flex: 1, padding: 16 }}>

            <FlatList
                data={invoices}
                keyExtractor={item => item.id.toString()}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        onPress={() => setSelected(item)}
                        style={{ flexDirection: "row", justifyContent: "space-between", padding: 14, backgroundColor: "#fff", borderRadius: 12, marginBottom: 10, elevation: 1 }}
                    >
                        <View>
                            <Text style={{ fontWeight: "700" }}>Hóa đơn #{item.id}</Text>
                            <Text style={{ color: "#aaa", fontSize: 12 }}>{new Date(item.created_at).toLocaleDateString("vi-VN")}</Text>
                            <Text style={{ color: "#666", fontSize: 12 }}>{item.details.length} món</Text>
                        </View>
                        <View style={{ alignItems: "flex-end" }}>
                            <Text style={{ fontWeight: "bold" }}>{parseInt(item.total_amount).toLocaleString("vi-VN")}đ</Text>
                            <Text style={{ color: item.is_paid ? "green" : "red" }}> {item.is_paid ? "Đã thanh toán" : "Chưa thanh toán"}</Text>
                        </View>
                    </TouchableOpacity>
                )}
            />

            <Modal visible={!!selected} transparent onRequestClose={() => setSelected(null)}>
                <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.3)" }}>
                    <View style={{ backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 }}>

                        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
                            <Text style={{ fontSize: 16, fontWeight: "bold" }}>Hóa đơn #{selected?.id}</Text>
                            <TouchableOpacity onPress={() => setSelected(null)}>
                                <Ionicons name="close-circle" size={26} color="#aaa" />
                            </TouchableOpacity>
                        </View>

                        <Text style={{ color: "#aaa", fontSize: 12, marginBottom: 12 }}>
                            {selected && new Date(selected.created_at).toLocaleString("vi-VN")}
                        </Text>

                        {selected?.details.map((d, i) => (
                            <View key={d.id} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" }}>
                                <Text>{i + 1}. {d.dish_name}</Text>
                                <Text style={{ fontWeight: "bold" }}>x{d.quantity}</Text>
                            </View>
                        ))}

                        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 16 }}>
                            <Text style={{ fontWeight: "600", color: "#666" }}>Tổng cộng</Text>
                            <Text style={{ fontWeight: "bold", fontSize: 18 }}>{selected && parseInt(selected.total_amount).toLocaleString("vi-VN")}đ</Text>
                        </View>

                        <Text style={{ textAlign: "center", marginTop: 16, fontWeight: "bold", color: selected?.is_paid ? "green" : "red" }}>
                            {selected?.is_paid ? "Đã thanh toán" : "Chưa thanh toán"}
                        </Text>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export default Invoices;
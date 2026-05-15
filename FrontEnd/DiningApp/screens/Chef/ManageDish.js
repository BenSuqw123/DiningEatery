import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Image, View, Text } from "react-native";
import { List, Searchbar, FAB } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authApis, endpoints } from "../../configs/Apis";
import { useNavigation } from "@react-navigation/native";
import Styles from "../../styles/Styles";

const ManageDish = () => {
    const [dishes, setDishes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [q, setQ] = useState("");
    const nav = useNavigation();

    const loadDishes = async () => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem("token");
            let url = endpoints["dishes"];
            if (q) url += `?q=${q}`;
            const res = await authApis(token).get(url);
            setDishes(res.data.results ?? res.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        const timer = setTimeout(() => loadDishes(), 500);
        return () => clearTimeout(timer);
    }, [q]);

    useEffect(() => {
        const unsub = nav.addListener('focus', loadDishes);
        return unsub;
    }, [nav]);

    return (
        <View style={{ flex: 1 }}>
            <Searchbar value={q} onChangeText={setQ} placeholder="Tìm món ăn..." />

            <FlatList
                data={dishes}
                keyExtractor={item => item.id.toString()}
                ListFooterComponent={loading && <ActivityIndicator />}
                renderItem={({ item }) => (
                    <List.Item
                        title={item.name}
                        description={`${parseInt(item.price).toLocaleString("vi-VN")}đ`}
                        left={() => (
                            <Image source={{ uri: item.image }} style={Styles.avatar} />
                        )}
                        right={() => (
                            <View style={{ justifyContent: "center", alignItems: "flex-end", maxWidth: 120 }}>
                                <Text style={{ fontSize: 11, color: "#888" }}>Nguyên liệu</Text>
                                <Text style={{ fontSize: 12, color: "#555", textAlign: "right" }} numberOfLines={2}>
                                    {item.ingredients?.map(i => i.ingredient?.name).join(", ") || "—"}
                                </Text>
                                <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                                    {item.time_served && (
                                        <Text style={{ fontSize: 11, color: "#0ea5e9" }}>{item.time_served} phút</Text>
                                    )}
                                </View>
                            </View>
                        )}
                        onPress={() => nav.navigate("CreateDish", { dish: item })}
                    />
                )}
            />

            <FAB label="Tạo món" icon="plus"
                onPress={() => nav.navigate("CreateDish", { dish: null })}
                style={{ position: "absolute", bottom: 20, right: 16, backgroundColor: "#333" }}
                color="#fff" />
        </View>
    );
};

export default ManageDish;
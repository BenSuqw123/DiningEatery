import React, { useEffect, useState, useContext } from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Image } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authApis, endpoints } from "../../configs/Apis";
import { MyUserContext } from "../../configs/MyContext";

const ChatListScreen = ({ navigation }) => {
    const [user]    = useContext(MyUserContext);
    const [list, setList]       = useState([]);
    const [loading, setLoading] = useState(true);
    const isChef = user?.role === 'CHEF';

    useEffect(() => {
        const load = async () => {
            try {
                const token = await AsyncStorage.getItem("token");
                const api   = authApis(token);

                if (isChef) {
                    // Chef: lấy danh sách phòng chat đã có
                    const res = await api.get(endpoints.chat_room_chef);
                    setList(res.data);
                } else {
                    // Customer: lấy toàn bộ danh sách chef
                    const res = await api.get(endpoints.chefs);
                    setList(res.data.results ?? res.data);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    if (loading) return <ActivityIndicator style={{ flex: 1 }} />;

    return (
        <View style={{ flex: 1, backgroundColor: "#fff" }}>
            <View style={{ backgroundColor: "#ff7043", padding: 16, alignItems: "center" }}>
                <Text style={{ color: "#fff", fontSize: 17, fontWeight: "600" }}>
                    {isChef ? "Khách hàng nhắn tin" : "Chat với đầu bếp"}
                </Text>
            </View>

            <FlatList
                data={list}
                keyExtractor={item => String(isChef ? item.room_id : item.id)}
                ItemSeparatorComponent={() =>
                    <View style={{ height: 0.5, backgroundColor: "#eee", marginLeft: 70 }} />
                }
                ListEmptyComponent={
                    <Text style={{ textAlign: "center", marginTop: 60, color: "#aaa" }}>
                        {isChef ? "Chưa có khách hàng nào nhắn tin" : "Không có đầu bếp nào"}
                    </Text>
                }
                renderItem={({ item }) => {
                    // Dữ liệu khác nhau tùy role
                    const name   = isChef
                        ? item.customer_name
                        : `${item.first_name} ${item.last_name}`;
                    const avatar = isChef ? item.customer_avatar : item.avatar;
                    const sub    = isChef
                        ? (item.last_message || "Chưa có tin nhắn")
                        : "Đầu bếp";

                    return (
                        <TouchableOpacity
                            onPress={() => navigation.navigate("Chat", isChef
                                ? { room_id: item.room_id, other_name: name, other_avatar: avatar }
                                : { chef_id: item.id, chef_name: name, chef_avatar: avatar }
                            )}
                            style={{ flexDirection: "row", alignItems: "center", padding: 14, gap: 12 }}
                        >
                            <View style={{
                                width: 44, height: 44, borderRadius: 22,
                                backgroundColor: "#ffe0d6",
                                alignItems: "center", justifyContent: "center"
                            }}>
                                {avatar
                                    ? <Image source={{ uri: avatar }}
                                        style={{ width: 44, height: 44, borderRadius: 22 }} />
                                    : <Text style={{ color: "#ff7043", fontWeight: "600", fontSize: 15 }}>
                                        {name?.[0]}
                                      </Text>
                                }
                            </View>

                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 15, fontWeight: "500", color: "#222" }}>
                                    {name}
                                </Text>
                                <Text style={{ fontSize: 12, color: "#999", marginTop: 2 }}>
                                    {sub}
                                </Text>
                            </View>

                            <Text style={{ fontSize: 22, color: "#ccc" }}>›</Text>
                        </TouchableOpacity>
                    );
                }}
            />
        </View>
    );
}

export default ChatListScreen;
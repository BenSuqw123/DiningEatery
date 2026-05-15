import { useState, useEffect, useContext } from "react";
import { View, Text, Image, ScrollView, TouchableOpacity, TextInput } from "react-native";
import { Appbar, ActivityIndicator, Divider, Button } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Apis, { endpoints, authApis } from "../../configs/Apis";
import { MyUserContext } from "../../configs/MyContext";

const DishDetail = ({ navigation, route }) => {
    const { dishId } = route.params;
    const [user] = useContext(MyUserContext);
    const [dish, setDish]     = useState(null);
    const [rates, setRates]   = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError]   = useState(null);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [rateError, setRateError] = useState(null);

    const loadRates = async () => {
        const res = await Apis.get(endpoints.rates(dishId));
        setRates(res.data.results ?? res.data);
    };

    useEffect(() => {
        Promise.all([
            Apis.get(`${endpoints.dishes}?dish_id=${dishId}`),
            Apis.get(endpoints.rates(dishId)),
        ]).then(([dishRes, rateRes]) => {
            const data = dishRes.data.results ?? dishRes.data;
            setDish(Array.isArray(data) ? data[0] : data);
            setRates(rateRes.data.results ?? rateRes.data);
        }).catch(() => setError("Không thể tải thông tin món ăn."))
          .finally(() => setLoading(false));
    }, [dishId]);

    const submitRate = async () => {
        if (!rating) { setRateError("Vui lòng chọn số sao."); return; }
        setSubmitting(true);
        setRateError(null);
        try {
            const token = await AsyncStorage.getItem("token");
            await authApis(token).post(endpoints.rates(dishId), { rating, comment });
            await loadRates();
            setRating(0);
            setComment("");
        } catch {
            setRateError("Gửi đánh giá thất bại.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <ActivityIndicator style={{ marginTop: 60 }} />;
    if (error)   return <Text style={{ textAlign: "center", marginTop: 60, color: "#c00" }}>{error}</Text>;

    const avgRating = rates.length
        ? (rates.reduce((s, r) => s + (r.rating || 0), 0) / rates.length).toFixed(1)
        : null;

    return (
        <View style={{ flex: 1, backgroundColor: "#fff" }}>
            <Appbar.Header style={{ backgroundColor: "#fff", elevation: 0, borderBottomWidth: 1, borderBottomColor: "#eee" }}>
                <Appbar.BackAction onPress={() => navigation.goBack()} />
                <Appbar.Content title={dish.name} titleStyle={{ fontSize: 16, fontWeight: "600" }} />
            </Appbar.Header>

            <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
                {dish.image
                    ? <Image source={{ uri: dish.image }} style={{ width: "100%", height: 220 }} resizeMode="cover" />
                    : <View style={{ height: 220, backgroundColor: "#eee", alignItems: "center", justifyContent: "center" }}>
                        <Text style={{ fontSize: 48 }}>🍽</Text>
                      </View>
                }

                <View style={{ padding: 16 }}>
                    <Text style={{ fontSize: 20, fontWeight: "700", color: "#111" }}>{dish.name}</Text>
                    <View style={{ flexDirection: "row", gap: 12, marginTop: 6, flexWrap: "wrap" }}>
                        <Text style={{ fontSize: 15, fontWeight: "600", color: "#333" }}>
                            {Number(dish.price).toLocaleString("vi-VN")}đ
                        </Text>
                        {!!dish.time_served && (
                            <Text style={{ fontSize: 13, color: "#888" }}>Thời gian phục vụ {dish.time_served} phút</Text>
                        )}
                        {!!avgRating && (
                            <Text style={{ fontSize: 13, color: "#888" }}>⭐ {avgRating} ({rates.length})</Text>
                        )}
                    </View>

                    {!!dish.description && (
                        <>
                            <Divider style={{ marginVertical: 12 }} />
                            <Text style={{ fontSize: 13, color: "#555", lineHeight: 20 }}>
                                {dish.description.replace(/<[^>]*>/g, "").trim()}
                            </Text>
                        </>
                    )}

                    {dish.ingredients?.length > 0 && (
                        <>
                            <Divider style={{ marginVertical: 12 }} />
                            <Text style={{ fontSize: 14, fontWeight: "600", color: "#222", marginBottom: 8 }}>Nguyên liệu</Text>
                            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                                {dish.ingredients.map((i, idx) => (
                                    <View key={idx} style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: "#f0f0f0" }}>
                                        <Text style={{ fontSize: 12, color: "#444" }}>
                                            {i.ingredient?.name}{i.quantity ? ` · ${i.quantity}` : ""}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        </>
                    )}

                    {dish.chefs?.length > 0 && (
                        <>
                            <Divider style={{ marginVertical: 12 }} />
                            <Text style={{ fontSize: 14, fontWeight: "600", color: "#222", marginBottom: 8 }}>Đầu bếp</Text>
                            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                                {dish.chefs.map((c) => (
                                    <View key={c.id} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                                        {c.avatar
                                            ? <Image source={{ uri: c.avatar }} style={{ width: 28, height: 28, borderRadius: 14 }} />
                                            : <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: "#ddd", alignItems: "center", justifyContent: "center" }}>
                                                <Text style={{ fontSize: 11 }}>👨‍🍳</Text>
                                              </View>
                                        }
                                        <Text style={{ fontSize: 13, color: "#444" }}>
                                            {`${c.first_name} ${c.last_name}`.trim() || `Chef #${c.id}`}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        </>
                    )}

                    <Divider style={{ marginVertical: 12 }} />
                    <Text style={{ fontSize: 14, fontWeight: "600", color: "#222", marginBottom: 8 }}>
                        {`Đánh giá${rates.length > 0 ? ` (${rates.length})` : ""}`}
                    </Text>

                    {user?.role?.toUpperCase() === "CUSTOMER" && (
                        <View style={{ padding: 12, borderWidth: 1, borderColor: "#e0e0e0", borderRadius: 8, marginBottom: 16 }}>
                            <View style={{ flexDirection: "row", gap: 8, marginBottom: 10 }}>
                                {[1, 2, 3, 4, 5].map((s) => (
                                    <TouchableOpacity key={s} onPress={() => setRating(s)}>
                                        <Text style={{ fontSize: 26, opacity: s <= rating ? 1 : 0.25 }}>⭐</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <TextInput
                                value={comment}
                                onChangeText={setComment}
                                placeholder="Nhận xét (tuỳ chọn)..."
                                placeholderTextColor="#aaa"
                                multiline
                                style={{ borderWidth: 1, borderColor: "#ddd", borderRadius: 6, padding: 8, fontSize: 13, minHeight: 60, marginBottom: 8, textAlignVertical: "top" }}
                            />
                            {!!rateError && <Text style={{ fontSize: 12, color: "#c00", marginBottom: 6 }}>{rateError}</Text>}
                            <Button mode="contained" onPress={submitRate} loading={submitting} buttonColor="#333" style={{ borderRadius: 6 }}>
                                Gửi đánh giá
                            </Button>
                        </View>
                    )}

                    {rates.length === 0
                        ? <Text style={{ fontSize: 13, color: "#999" }}>Chưa có đánh giá nào.</Text>
                        : rates.map((r, idx) => (
                            <View key={idx} style={{ marginBottom: 12, paddingBottom: 12, borderBottomWidth: idx < rates.length - 1 ? 1 : 0, borderBottomColor: "#f0f0f0" }}>
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                    {r.customer?.avatar
                                        ? <Image source={{ uri: r.customer.avatar }} style={{ width: 28, height: 28, borderRadius: 14 }} />
                                        : <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: "#eee", alignItems: "center", justifyContent: "center" }}>
                                            <Text style={{ fontSize: 12 }}>👤</Text>
                                          </View>
                                    }
                                    <Text style={{ fontSize: 13, fontWeight: "600", color: "#222" }}>
                                        {r.customer?.first_name || r.customer?.username || "Ẩn danh"}
                                    </Text>
                                    <Text style={{ color: "#f5a623" }}>{"⭐".repeat(r.rating || 0)}</Text>
                                </View>
                                {!!r.comment && (
                                    <Text style={{ fontSize: 13, color: "#555", marginLeft: 36 }}>{r.comment}</Text>
                                )}
                            </View>
                        ))
                    }
                </View>
            </ScrollView>
        </View>
    );
};

export default DishDetail;
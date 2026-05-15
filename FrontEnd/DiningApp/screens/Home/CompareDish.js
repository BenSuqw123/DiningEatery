import { useState, useEffect } from "react";
import { View, Text, ScrollView, Image, ActivityIndicator } from "react-native";
import { Appbar } from "react-native-paper";
import Apis, { endpoints } from "../../configs/Apis";

const fmt_price  = (p) => Number(p).toLocaleString("vi-VN") + "đ";
const fmt_time   = (t) => (t ? `${t} phút` : "—");
const fmt_rating = (r, c) => (r ? `⭐ ${Number(r).toFixed(1)} (${c})` : "Chưa có");
const best_idx   = (arr, key, mode) => {
    const vals   = arr.map((d) => Number(d[key]) || 0);
    const target = mode === "min" ? Math.min(...vals) : Math.max(...vals);
    return vals.indexOf(target);
};

const CRITERIA = [
    { key: "price",       label: "Giá",        render: (d) => fmt_price(d.price),                                               best: "min" },
    { key: "time_served", label: "Thời gian",   render: (d) => fmt_time(d.time_served),                                         best: "min" },
    { key: "avg_rating",  label: "Đánh giá",    render: (d) => fmt_rating(d.avg_rating, d.rating_count),                        best: "max" },
    { key: "ingredients", label: "Nguyên liệu", render: (d) => d.ingredients?.map((i) => i.ingredient?.name).join(", ") || "—", best: null  },
];

const COL_W   = 90;
const LABEL_W = 72;

const CompareDish = ({ navigation, route }) => {
    const { selectedDishes } = route.params;
    const [result,  setResult]  = useState(null);
    const [loading, setLoading] = useState(true);
    const [error,   setError]   = useState(null);

    useEffect(() => {
        const ids = selectedDishes.map((d) => d.id).join(",");
        Apis.get(`${endpoints.dishes}compare/?ids=${ids}`)
            .then((res) => setResult(res.data))
            .catch(() => setError("So sánh thất bại, thử lại sau."))
            .finally(() => setLoading(false));
    }, []);

    return (
        <View style={{ flex: 1, backgroundColor: "#f8f9fa" }}>
            <Appbar.Header style={{ backgroundColor: "#fff", elevation: 0, borderBottomWidth: 1, borderBottomColor: "#eee" }}>
                <Appbar.BackAction onPress={() => navigation.goBack()} />
                <Appbar.Content title="So sánh món ăn" titleStyle={{ fontSize: 17, fontWeight: "600" }} />
            </Appbar.Header>

            {loading && <ActivityIndicator style={{ marginTop: 40 }} size="large" />}
            {!!error  && <Text style={{ textAlign: "center", marginTop: 40, color: "red" }}>{error}</Text>}

            {!loading && result && (
                <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>

                    {result.length > 3 && (
                        <Text style={{ fontSize: 11, color: "#aaa", textAlign: "center", marginBottom: 8 }}>
                            ← Vuốt ngang để xem thêm →
                        </Text>
                    )}

                    <View style={{ backgroundColor: "#fff", borderRadius: 14, overflow: "hidden", elevation: 2 }}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <View>

                                {/* Header ảnh + tên */}
                                <View style={{ flexDirection: "row", backgroundColor: "#f9f9f9", borderBottomWidth: 1, borderBottomColor: "#eee" }}>
                                    <View style={{ width: LABEL_W, padding: 10 }} />
                                    {result.map((d) => (
                                        <View key={d.id} style={{ width: COL_W, padding: 10, alignItems: "center", borderLeftWidth: 1, borderLeftColor: "#eee" }}>
                                            {d.image
                                                ? <Image source={{ uri: d.image }} style={{ width: 48, height: 48, borderRadius: 8, marginBottom: 6 }} />
                                                : <View style={{ width: 48, height: 48, borderRadius: 8, backgroundColor: "#f0f0f0", alignItems: "center", justifyContent: "center", marginBottom: 6 }}>
                                                    <Text style={{ fontSize: 22 }}>🍽</Text>
                                                  </View>
                                            }
                                            <Text style={{ fontSize: 12, fontWeight: "700", textAlign: "center", color: "#222" }} numberOfLines={2}>
                                                {d.name}
                                            </Text>
                                        </View>
                                    ))}
                                </View>

                                {/* Các hàng tiêu chí */}
                                {CRITERIA.map((crit, ci) => {
                                    const winIdx = crit.best ? best_idx(result, crit.key, crit.best) : -1;
                                    return (
                                        <View key={crit.key} style={{ flexDirection: "row", backgroundColor: ci % 2 === 0 ? "#fff" : "#fafafa", borderBottomWidth: 1, borderBottomColor: "#f0f0f0" }}>
                                            <View style={{ width: LABEL_W, padding: 12, justifyContent: "center" }}>
                                                <Text style={{ fontSize: 12, fontWeight: "600", color: "#888" }}>{crit.label}</Text>
                                            </View>
                                            {result.map((d, di) => {
                                                const isWin = winIdx === di;
                                                return (
                                                    <View key={d.id} style={{ width: COL_W, padding: 10, alignItems: "center", justifyContent: "center", borderLeftWidth: 1, borderLeftColor: "#eee", backgroundColor: isWin ? "#fff8e1" : "transparent" }}>
                                                        <Text style={{ fontSize: 12, textAlign: "center", fontWeight: isWin ? "700" : "400", color: isWin ? "#222" : "#555" }}>
                                                            {crit.render(d)}
                                                        </Text>
                                                        {isWin && crit.best && (
                                                            <View style={{ marginTop: 4, backgroundColor: "#e53935", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
                                                                <Text style={{ fontSize: 10, color: "#fff", fontWeight: "700" }}>Tốt nhất</Text>
                                                            </View>
                                                        )}
                                                    </View>
                                                );
                                            })}
                                        </View>
                                    );
                                })}

                            </View>
                        </ScrollView>
                    </View>
                </ScrollView>
            )}
        </View>
    );
};

export default CompareDish;
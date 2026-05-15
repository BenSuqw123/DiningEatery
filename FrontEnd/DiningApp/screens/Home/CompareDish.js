import { useState, useEffect } from "react";
import { View, Text, ScrollView, Image } from "react-native";
import { Appbar, ActivityIndicator, Divider } from "react-native-paper";
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
    { key: "price",       label: "Giá",         render: (d) => fmt_price(d.price),                                               best: "min" },
    { key: "time_served", label: "Thời gian",    render: (d) => fmt_time(d.time_served),                                         best: "min" },
    { key: "avg_rating",  label: "Đánh giá",     render: (d) => fmt_rating(d.avg_rating, d.rating_count),                        best: "max" },
    { key: "ingredients", label: "Nguyên liệu",  render: (d) => d.ingredients?.map((i) => i.ingredient?.name).join(", ") || "—", best: null  },
];

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
        <View style={{ flex: 1, backgroundColor: "#fff" }}>
            <Appbar.Header style={{ backgroundColor: "#fff", elevation: 0, borderBottomWidth: 1, borderBottomColor: "#eee" }}>
                <Appbar.BackAction onPress={() => navigation.goBack()} />
                <Appbar.Content title="So sánh món ăn" titleStyle={{ fontSize: 17, fontWeight: "600" }} />
            </Appbar.Header>

            {loading && <ActivityIndicator style={{ marginTop: 40 }} />}
            {!!error && <Text style={{ textAlign: "center", marginTop: 40, color: "#c00" }}>{error}</Text>}

            {!loading && result && (
                <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
                    <View style={{ borderWidth: 1, borderColor: "#e0e0e0", borderRadius: 10, overflow: "hidden" }}>
                        {/* header tên món */}
                        <View style={{ flexDirection: "row", backgroundColor: "#f9f9f9" }}>
                            <View style={{ width: 80, padding: 10, borderRightWidth: 1, borderRightColor: "#e0e0e0" }} />
                            {result.map((d) => (
                                <View key={d.id} style={{ flex: 1, padding: 8, alignItems: "center", borderRightWidth: 1, borderRightColor: "#e0e0e0" }}>
                                    {d.image
                                        ? <Image source={{ uri: d.image }} style={{ width: 40, height: 40, borderRadius: 6, marginBottom: 4 }} />
                                        : <View style={{ width: 40, height: 40, borderRadius: 6, backgroundColor: "#eee", alignItems: "center", justifyContent: "center", marginBottom: 4 }}>
                                            <Text style={{ fontSize: 18 }}>🍽</Text>
                                          </View>
                                    }
                                    <Text style={{ fontSize: 11, fontWeight: "600", textAlign: "center", color: "#222" }} numberOfLines={2}>
                                        {d.name}
                                    </Text>
                                </View>
                            ))}
                        </View>

                        <Divider />

                        {CRITERIA.map((crit, ci) => {
                            const winIdx = crit.best ? best_idx(result, crit.key, crit.best) : -1;
                            return (
                                <View key={crit.key}>
                                    <View style={{ flexDirection: "row", backgroundColor: ci % 2 === 0 ? "#fff" : "#fafafa" }}>
                                        <View style={{ width: 80, padding: 10, justifyContent: "center", borderRightWidth: 1, borderRightColor: "#e0e0e0" }}>
                                            <Text style={{ fontSize: 11, color: "#666" }}>{crit.label}</Text>
                                        </View>
                                        {result.map((d, di) => {
                                            const isWin = winIdx === di;
                                            return (
                                                <View key={d.id} style={{ flex: 1, padding: 8, alignItems: "center", justifyContent: "center", borderRightWidth: 1, borderRightColor: "#e0e0e0" }}>
                                                    <Text style={{ fontSize: 11, textAlign: "center", color: isWin ? "#111" : "#555", fontWeight: isWin ? "700" : "400" }}>
                                                        {crit.render(d)}
                                                    </Text>
                                                    {isWin && crit.best && (
                                                        <Text style={{ fontSize: 10, color: "#888", marginTop: 2 }}>↑ tốt nhất</Text>
                                                    )}
                                                </View>
                                            );
                                        })}
                                    </View>
                                    <Divider />
                                </View>
                            );
                        })}
                    </View>
                </ScrollView>
            )}
        </View>
    );
};

export default CompareDish;
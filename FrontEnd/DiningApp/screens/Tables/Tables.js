import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, RefreshControl, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import Apis, { endpoints } from "../../configs/Apis";
import TableCard from "../../components/Tables/TableCard";

const FILTERS = [
    { value: "ALL", label: "Tất cả" },
    { value: "AVAILABLE", label: "Trống" },
    { value: "BOOKED", label: "Đã đặt" },
    { value: "OCCUPIED", label: "Đang dùng" },
];

const Tables = () => {
    const navigation = useNavigation();

    const [tables, setTables] = useState([]);
    const [filter, setFilter] = useState("ALL");
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

    const loadTables = async () => {
        try {
            setError("");
            const res = await Apis.get(endpoints.tables);
            setTables(res.data.results ?? res.data);
        } catch (err) {
            console.log(err.response?.data || err.message);
            setError("Không thể tải danh sách bàn.");
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            setLoading(true);
            loadTables();
        }, [])
    );

    const onRefresh = async () => {
        setRefreshing(true);
        await loadTables();
        setRefreshing(false);
    };

    const filteredTables = useMemo(() => {
        if (filter === "ALL") return tables;
        return tables.filter((table) => table.status === filter);
    }, [tables, filter]);

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f7f5f2" }}>
                <ActivityIndicator size="large" />
                <Text style={{ marginTop: 10, color: "#666" }}>Đang tải bàn...</Text>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: "#f7f5f2", paddingTop: 50 }}>
            <Text style={{ fontSize: 22, fontWeight: "700", paddingHorizontal: 14 }}>
                Quản lý bàn
            </Text>

            <View style={{ flexDirection: "row", paddingHorizontal: 10, paddingVertical: 10, gap: 8 }}>
                {FILTERS.map((item) => (
                    <TouchableOpacity
                        key={item.value}
                        onPress={() => setFilter(item.value)}
                        style={{
                            paddingHorizontal: 10,
                            paddingVertical: 7,
                            borderRadius: 20,
                            backgroundColor: filter === item.value ? "#333" : "#fff",
                            borderWidth: 1,
                            borderColor: "#ddd",
                        }}
                    >
                        <Text style={{ color: filter === item.value ? "#fff" : "#333", fontSize: 12, fontWeight: "600" }}>
                            {item.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {!!error && (
                <Text style={{ color: "#c00", paddingHorizontal: 14, marginBottom: 8 }}>
                    {error}
                </Text>
            )}

            <FlatList
                data={filteredTables}
                keyExtractor={(item) => String(item.id)}
                numColumns={2}
                columnWrapperStyle={{ justifyContent: "space-between", paddingHorizontal: 14 }}
                contentContainerStyle={{ paddingBottom: 24 }}
                renderItem={({ item }) => (
                    <TableCard
                        table={item}
                        onPress={() => navigation.navigate("TableDetailPage", { table: item })}
                    />
                )}
                ListEmptyComponent={
                    <Text style={{ textAlign: "center", color: "#888", marginTop: 40 }}>
                        Không có bàn phù hợp.
                    </Text>
                }
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            />
        </View>
    );
};

export default Tables;

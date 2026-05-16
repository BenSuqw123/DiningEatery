import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Image, TouchableOpacity, View, Text } from "react-native";
import Apis, { endpoints } from "../../configs/Apis";
import { List, Searchbar, FAB } from "react-native-paper";
import Styles from "../../styles/Styles";
import { useNavigation } from "@react-navigation/native";

const Home = ({ cateId, ordering, filters }) => {
    const [dishes, setDishes]           = useState([]);
    const [loading, setLoading]         = useState(false);
    const [q, setQ]                     = useState("");
    const [page, setPage]               = useState(1);
    const [compareMode, setCompareMode] = useState(false);
    const [selected, setSelected]       = useState([]);
    const nav = useNavigation();

    const loadDishes = async () => {
    try {
        setLoading(true);
        let url = `${endpoints["dishes"]}?page=${page}`;
        if (q)                    url += `&q=${q}`;
        if (cateId)               url += `&category_id=${cateId}`;
        if (ordering)             url += `&ordering=${ordering}`;
        if (filters?.chef_name)   url += `&chef_name=${filters.chef_name}`;
        if (filters?.price)       url += `&price=${filters.price}`;
        if (filters?.time_served) url += `&time_served=${filters.time_served}`;
        if (filters?.ingre_name)  url += `&ingre_name=${filters.ingre_name}`;

        const res = await Apis.get(url);
        if (!res.data.next || res.data.results?.length === 0) setPage(0);
        if (page === 1) setDishes(res.data.results);
        else setDishes(prev => [...prev, ...res.data.results]);
    } catch (ex) {
        if (ex?.response?.status === 404) {
            setPage(0);
        } else {
            console.error("loadDishes error:", ex);
        }
    } finally {
        setLoading(false);
    }
    };

    useEffect(() => {
        const timer = setTimeout(() => { if (page > 0) loadDishes(); }, 500);
        return () => clearTimeout(timer);
    }, [q, cateId, page, ordering,
        filters?.chef_name, filters?.price, filters?.time_served, filters?.ingre_name]);

    useEffect(() => { setPage(1); }, [q, cateId, ordering,
        filters?.chef_name, filters?.price, filters?.time_served, filters?.ingre_name]);

    const loadMore = () => { if (page > 0 && !loading) setPage(page + 1); };

    const getChefNames = (chefs) => {
        if (!chefs || chefs.length === 0) return "Chưa có đầu bếp";
        return chefs.map(c => `${c.first_name} ${c.last_name}`.trim() || `Chef #${c.id}`).join(", ");
    };

    const toggleSelect = (item) => {
        setSelected(prev => {
            if (prev.find(d => d.id === item.id)) return prev.filter(d => d.id !== item.id);
            if (prev.length >= 3) return prev;
            return [...prev, item];
        });
    };

    const goCompare = () => {
        nav.navigate("CompareDish", { selectedDishes: selected });
        setCompareMode(false);
        setSelected([]);
    };

    return (
        <View style={{ flex: 1 }}>
            <Searchbar value={q} onChangeText={setQ} placeholder="Tìm món ăn..." />

            {compareMode && (
                <View style={{ flexDirection: "row", justifyContent: "space-between",
                    paddingHorizontal: 14, paddingVertical: 8,
                    borderBottomWidth: 1, borderBottomColor: "#e0e0e0" }}>
                    <Text style={{ fontSize: 13, color: "#555" }}>Đã chọn {selected.length}/3 món</Text>
                    <TouchableOpacity onPress={() => { setCompareMode(false); setSelected([]); }}>
                        <Text style={{ fontSize: 13, color: "#888" }}>Hủy</Text>
                    </TouchableOpacity>
                </View>
            )}

            <FlatList
                onEndReached={loadMore}
                ListFooterComponent={loading && <ActivityIndicator />}
                data={dishes}
                keyExtractor={item => item.id.toString()}
                renderItem={({ item }) => {
                    const isSelected = selected.some(d => d.id === item.id);
                    return (
                        <TouchableOpacity onPress={() => compareMode ? toggleSelect(item) : nav.navigate("DishDetail", { dishId: item.id })}>
                            <List.Item
                                title={item.name}
                                description={`${parseInt(item.price).toLocaleString("vi-VN")}đ`}
                                titleStyle={isSelected ? { fontWeight: "700" } : {}}
                                style={{ backgroundColor: isSelected ? "#f0f0f0" : "#fff" }}
                                left={() => (
                                    <View>
                                        <Image style={Styles.avatar} source={{ uri: item.image }} />
                                        {isSelected && (
                                            <View style={{ position: "absolute", top: 0, right: 0,
                                                width: 18, height: 18, borderRadius: 9,
                                                backgroundColor: "#333", alignItems: "center", justifyContent: "center" }}>
                                                <Text style={{ color: "#fff" }}>✓</Text>
                                            </View>
                                        )}
                                    </View>
                                )}
                                right={() => (
                                    <View style={{ justifyContent: "center", alignItems: "flex-end", maxWidth: 120 }}>
                                        <Text style={{ fontSize: 11, color: "#888" }}>Đầu bếp</Text>
                                        <Text style={{ fontSize: 12, color: "#555", textAlign: "right" }} numberOfLines={2}>
                                            {getChefNames(item.chefs)}
                                        </Text>
                                        <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                                            {item.time_served && (
                                                <Text style={{ fontSize: 11, color: "#0ea5e9" }}>{item.time_served} phút</Text>
                                            )}
                                            {item.avg_rating && (
                                                <Text style={{ fontSize: 11, color: "#f59e0b" }}>⭐{item.avg_rating}</Text>
                                            )}
                                        </View>
                                    </View>
                                )}
                            />
                        </TouchableOpacity>
                    );
                }}
            />

            {compareMode ? (
                <FAB label={`So sánh ${selected.length} món`} disabled={selected.length < 2}
                    onPress={goCompare}
                    style={{ position: "absolute", bottom: 20, right: 16, backgroundColor: selected.length >= 2 ? "#333" : "#ccc" }}
                    color="#fff" />
            ) : (
                <FAB label="So sánh món" onPress={() => setCompareMode(true)}
                    style={{ position: "absolute", bottom: 20, right: 16, backgroundColor: "#333" }}
                    color="#fff" />
            )}
        </View>
    );
};

export default Home;
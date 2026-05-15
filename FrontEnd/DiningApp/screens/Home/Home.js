import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Image, TouchableOpacity, View, Text } from "react-native";
import Apis, { endpoints } from "../../configs/Apis";
import { List, Searchbar, FAB, Banner } from "react-native-paper";
import Styles from "../../styles/Styles";
import { useNavigation } from "@react-navigation/native";

const Home = ({ cateId }) => {
    const [dishes, setDishes]       = useState([]);
    const [loading, setLoading]     = useState(false);
    const [q, setQ]                 = useState("");
    const [page, setPage]           = useState(1);
    const [compareMode, setCompareMode] = useState(false);
    const [selected, setSelected]   = useState([]);
    const nav = useNavigation();

    const loadDishes = async () => {
        try {
            setLoading(true);
            let url = `${endpoints['dishes']}?page=${page}`;
            if (q) url = `${url}&q=${q}`;
            if (cateId) url = `${url}&category_id=${cateId}`;

            console.info(url);
            let res = await Apis.get(url);

            if (res.data.next === null) setPage(0);
            if (page === 1)
                setDishes(res.data.results);
            else if (page > 1)
                setDishes([...dishes, ...res.data.results]);
        } catch (ex) {
            console.error(ex);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        let timer = setTimeout(() => {
            if (page > 0) loadDishes();
        }, 500);
        return () => clearTimeout(timer);
    }, [q, cateId, page]);

    useEffect(() => {
        setPage(1);
    }, [q, cateId]);

    const loadMore = () => {
        if (page > 0 && !loading) setPage(page + 1);
    }

    const getChefNames = (chefs) => {
        if (!chefs || chefs.length === 0) return "Chưa có đầu bếp";
        return chefs.map(c => {
            const name = `${c.first_name} ${c.last_name}`.trim();
            return name || c.first_name || `Chef #${c.id}`;
        }).join(", ");
    }

    const toggleCompareMode = () => {
        setCompareMode(!compareMode);
        setSelected([]);
    };

    const toggleSelect = (item) => {
        setSelected((prev) => {
            if (prev.find((d) => d.id === item.id)) return prev.filter((d) => d.id !== item.id);
            if (prev.length >= 5) return prev;
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
                <View style={{ flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#e0e0e0" }}>
                    <Text style={{ fontSize: 13, color: "#555" }}>
                        Đã chọn {selected.length}/5 món
                    </Text>
                    <TouchableOpacity onPress={toggleCompareMode}>
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
                    const isSelected = selected.some((d) => d.id === item.id);
                    const disabled   = compareMode && !isSelected && selected.length >= 5;
                    return (
                        <TouchableOpacity onPress={() => compareMode ? toggleSelect(item) : nav.navigate("DishDetail", { dishId: item.id })}>
                            <List.Item
                                title={item.name}
                                description={`${item.price} VNĐ`}
                                titleStyle={isSelected ? { fontWeight: "700" } : {}}
                                style={{ backgroundColor: isSelected ? "#f0f0f0" : "#fff" }}
                                left={() => (
                                    <View>
                                        <Image style={Styles.avatar} source={{ uri: item.image }} />
                                        {isSelected && (
                                            <View style={{ position: "absolute", top: 0, right: 0, width: 18, height: 18, borderRadius: 9, backgroundColor: "#333", alignItems: "center", justifyContent: "center" }}>
                                                <Text style={{ color: "#fff" }}>✓</Text>
                                            </View>
                                        )}
                                    </View>
                                )}
                                right={() => (
                                    <View style={{ justifyContent: "center", alignItems: "flex-end", maxWidth: 110 }}>
                                        <Text >Đầu bếp</Text>
                                        <Text numberOfLines={2}>
                                            {getChefNames(item.chefs)}
                                        </Text>
                                    </View>
                                )}
                            />
                        </TouchableOpacity>
                    );
                }}
            />

            {compareMode ? (
                <FAB label={`So sánh ${selected.length} món`} disabled={selected.length < 2} onPress={goCompare} style={{ position: "absolute", bottom: 20, right: 16, backgroundColor: selected.length >= 2 ? "#333" : "#ccc" }} color="#fff"/>
            ) : (
                <FAB label={`So sánh món`} onPress={toggleCompareMode} style={{ position: "absolute", bottom: 20, right: 16, backgroundColor: "#333" }} color="#fff"/>
            )}
        </View>
    );
}

export default Home;
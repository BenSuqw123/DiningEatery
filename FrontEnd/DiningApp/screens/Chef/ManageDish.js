import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Image, View, Text, ScrollView, TouchableOpacity } from "react-native";
import { List, Searchbar, FAB, Chip, TextInput, Button } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authApis, endpoints } from "../../configs/Apis";
import { useNavigation } from "@react-navigation/native";
import Styles from "../../styles/Styles";
import Apis from "../../configs/Apis";

const SORT_OPTIONS = [
    { label: "Tên A-Z",  value: "name"   },
    { label: "Tên Z-A",  value: "-name"  },
    { label: "Giá thấp", value: "price"  },
    { label: "Giá cao",  value: "-price" },
    { label: "Đánh giá", value: "rating" },
];

const ManageDish = () => {
    const [dishes, setDishes]       = useState([]);
    const [loading, setLoading]     = useState(false);
    const [q, setQ]                 = useState("");
    const [categories, setCategories] = useState([]);
    const [cateId, setCateId]       = useState(null);
    const [ordering, setOrdering]   = useState("");
    const [filters, setFilters]     = useState({ chef_name: "", price: "", time_served: "", ingre_name: "" });
    const [showFilter, setShowFilter] = useState(false);
    const nav = useNavigation();

    const hasFilter = Object.values(filters).some(v => v !== "");

    const loadDishes = async () => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem("token");
            let url = `${endpoints["dishes"]}?page=1`;
            if (q)                   url += `&q=${q}`;
            if (cateId)              url += `&category_id=${cateId}`;
            if (ordering)            url += `&ordering=${ordering}`;
            if (filters.chef_name)   url += `&chef_name=${filters.chef_name}`;
            if (filters.price)       url += `&price=${filters.price}`;
            if (filters.time_served) url += `&time_served=${filters.time_served}`;
            if (filters.ingre_name)  url += `&ingre_name=${filters.ingre_name}`;
            const res = await authApis(token).get(url);
            setDishes(res.data.results ?? res.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => {
    Apis.get(endpoints['categories']).then(res => setCategories(res.data.results ?? res.data));
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => loadDishes(), 500);
        return () => clearTimeout(timer);
    }, [q, cateId, ordering,
        filters.chef_name, filters.price, filters.time_served, filters.ingre_name]);

    useEffect(() => {
        const unsub = nav.addListener('focus', loadDishes);
        return unsub;
    }, [nav]);

    return (
        <View style={{ flex: 1 }}>
            <Searchbar value={q} onChangeText={setQ} placeholder="Tìm món ăn..." />

            {/* Category chips */}
            <View style={{ height: 50 }}>
                <ScrollView horizontal
                    contentContainerStyle={{ gap: 10, alignItems: 'center' }}>
                    <TouchableOpacity onPress={() => setCateId(null)}>
                        <Chip icon="label" mode={!cateId ? "outlined" : "flat"}>Tất cả</Chip>
                    </TouchableOpacity>
                    {categories.map(c => (
                        <TouchableOpacity key={c.id} onPress={() => setCateId(c.id)}>
                            <Chip icon="label" mode={c.id === cateId ? "outlined" : "flat"}>
                                {c.name}
                            </Chip>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Sort chips */}
            <View style={{ height: 50 }}>
                <ScrollView horizontal 
                    contentContainerStyle={{ gap: 10, alignItems: 'center' }}>
                    {SORT_OPTIONS.map(opt => (
                        <Chip key={opt.value}
                            mode={ordering === opt.value ? "outlined" : "flat"}
                            showSelectedCheck={false}
                            onPress={() => setOrdering(prev => prev === opt.value ? "" : opt.value)}>
                            {opt.label}
                        </Chip>
                    ))}
                </ScrollView>
            </View>

            {/* Filter toggle */}
            <TouchableOpacity onPress={() => setShowFilter(p => !p)}
                style={{ paddingHorizontal: 12, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ color: hasFilter ? '#0ea5e9' : '#888', fontSize: 13 }}>
                    {showFilter ? "Ẩn bộ lọc" : "Lọc nâng cao"}
                </Text>
                {hasFilter && <Text style={{ fontSize: 11, color: '#0ea5e9' }}>● Đang lọc</Text>}
            </TouchableOpacity>

            {/* Filter panel */}
            {showFilter && (
                <View style={{ paddingHorizontal: 12, paddingBottom: 8, gap: 8 }}>
                    <TextInput mode="outlined" dense label="Tên đầu bếp"
                        value={filters.chef_name}
                        onChangeText={t => setFilters({ ...filters, chef_name: t })} />
                    <TextInput mode="outlined" dense label="Nguyên liệu"
                        value={filters.ingre_name}
                        onChangeText={t => setFilters({ ...filters, ingre_name: t })} />
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                        <TextInput mode="outlined" dense label="Giá tối đa (đ)"
                            value={filters.price} keyboardType="numeric" style={{ flex: 1 }}
                            onChangeText={t => setFilters({ ...filters, price: t })} />
                        <TextInput mode="outlined" dense label="Thời gian tối đa (phút)"
                            value={filters.time_served} keyboardType="numeric" style={{ flex: 1 }}
                            onChangeText={t => setFilters({ ...filters, time_served: t })} />
                    </View>
                    {hasFilter && (
                        <Button compact mode="outlined"
                            onPress={() => setFilters({ chef_name: "", price: "", time_served: "", ingre_name: "" })}>
                            Xóa bộ lọc
                        </Button>
                    )}
                </View>
            )}

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
                                {item.time_served && (
                                    <Text style={{ fontSize: 11, color: "#0ea5e9", marginTop: 4 }}>{item.time_served} phút</Text>
                                )}
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
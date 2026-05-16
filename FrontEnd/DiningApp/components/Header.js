import { useEffect, useState } from "react";
import Apis, { endpoints } from "../configs/Apis";
import Styles from "../styles/Styles";
import { Chip, TextInput, Button } from "react-native-paper";
import { Text, TouchableOpacity, View, ScrollView } from "react-native";

const SORT_OPTIONS = [
    { label: "Tên A-Z",  value: "name"   },
    { label: "Tên Z-A",  value: "-name"  },
    { label: "Giá thấp", value: "price"  },
    { label: "Giá cao",  value: "-price" },
    { label: "Đánh giá", value: "rating" },
];

const Header = ({ cateId, setCateId, ordering, setOrdering, filters, setFilters }) => {
    const [categories, setCategories] = useState([]);
    const [showFilter, setShowFilter] = useState(false);

    const loadCategories = async () => {
        let res = await Apis.get(endpoints['categories']);
        setCategories(res.data);
    }

    useEffect(() => { loadCategories(); }, []);

    const hasFilter = Object.values(filters).some(v => v !== "");

    return (
        <View style={{ paddingTop: 50 }}>
            <Text style={{ fontSize: 22, fontWeight: "bold", paddingHorizontal: 10, marginBottom: 2 }}>
                Nhà hàng DiningEatery
            </Text>
            <Text style={{ fontSize: 14, color: "gray", paddingHorizontal: 10, marginBottom: 8 }}>
                Hôm nay bạn muốn ăn gì?
            </Text>

            {/* Category chips */}
            <ScrollView horizontal>
                <TouchableOpacity onPress={() => setCateId(null)}>
                    <Chip style={Styles.margin} icon="label"
                        mode={!cateId ? "outlined" : "flat"}>
                        Tất cả
                    </Chip>
                </TouchableOpacity>
                {categories.map(c => (
                    <TouchableOpacity key={c.id} onPress={() => setCateId(c.id)}>
                        <Chip style={Styles.margin} icon="label"
                            mode={c.id === cateId ? "outlined" : "flat"}>
                            {c.name}
                        </Chip>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Sort chips */}
            <View style={{ height: 50 }}>
                <ScrollView horizontal
                    contentContainerStyle={{ gap: 10, paddingHorizontal: 8, alignItems: 'center' }}>
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
                <Text style={{ color:'#888', fontSize: 13 }}>
                    {showFilter ? "Ẩn bộ lọc" : "Lọc nâng cao"}
                </Text>
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
        </View>
    );
};

export default Header;
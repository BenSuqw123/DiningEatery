import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Image, TouchableOpacity, View, Text } from "react-native";
import Apis, { endpoints } from "../../configs/Apis";
import { List, Searchbar } from "react-native-paper";
import Styles from "../../styles/Styles";
import { useNavigation } from "@react-navigation/native";

const Home = ({ cateId }) => {
    const [dishes, setDishes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [q, setQ] = useState("");
    const [page, setPage] = useState(1);
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

    return (
        <View>
            <Searchbar value={q} onChangeText={setQ}
                placeholder="Tìm món ăn..." />
            <FlatList onEndReached={loadMore}
                ListFooterComponent={loading && <ActivityIndicator />}
                data={dishes}
                keyExtractor={item => item.id.toString()}
                renderItem={({ item }) =>
                    <List.Item
                        title={item.name}
                        description={`${item.price} VNĐ`}
                        left={() =>
                            <TouchableOpacity onPress={() => nav.navigate('DishDetail', { dishId: item.id })}>
                                <Image style={Styles.avatar} source={{ uri: item.image }} />
                            </TouchableOpacity>
                        }
                        right={() =>
                            <View style={{ justifyContent: "center", alignItems: "flex-end", maxWidth: 110 }}>
                                <Text style={{ fontSize: 11, color: "#888" }}>Đầu bếp</Text>
                                <Text style={{ fontSize: 12, color: "#555", textAlign: "right" }} numberOfLines={2}>
                                    {getChefNames(item.chefs)}
                                </Text>
                            </View>
                        }
                    />
                }
            />
        </View>
    );
}

export default Home;
import { useEffect, useState } from "react";
import Apis, { endpoints } from "../configs/Apis";
import Styles from "../styles/Styles";
import { Chip } from "react-native-paper";
import { Text, TouchableOpacity, View, ScrollView } from "react-native";

const Header = ({cateId, setCateId}) => {
    const [categories, setCategories] = useState([]);

    const loadCategories = async () => {
        let res = await Apis.get(endpoints['categories']);
        setCategories(res.data);
    }

    useEffect(() => {
        loadCategories();
    }, [])

    return (
        <View style={{ paddingTop: 50 }}>
            <Text style={{ fontSize: 22, fontWeight: "bold", paddingHorizontal: 10, marginBottom: 2 }}>
                Nhà hàng DiningEatery
            </Text>
            <Text style={{ fontSize: 14, color: "gray", paddingHorizontal: 10, marginBottom: 8 }}>
                Hôm nay bạn muốn ăn gì?
            </Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <TouchableOpacity onPress={() => setCateId(null)}>
                    <Chip style={Styles.margin} icon="label">Tất cả</Chip>
                </TouchableOpacity>

                {categories.map(c => (
                    <TouchableOpacity key={c.id} onPress={() => setCateId(c.id)}>
                        <Chip style={Styles.margin} icon="label">{c.name}</Chip>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
}

export default Header;
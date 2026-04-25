import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
import Apis, { endpoints } from "../../configs/Apis";
import { SearchBar } from "react-native-screens";
import { ActivityIndicator, FlatList, Image, TouchableOpacity, View } from "react-native";

const Home =({cateId}) =>{
    const [dishes, setDishes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [q, setQ] = useState("");
    const [page, setPage] = useState(1);
    const nav = useNavigation();

    const loadDishes = async () =>{
        try{
            setLoading(true);

            let url = `${endpoints['dishes']}?page=${page}`;
            if(q){
                url = `${url}&q=${q}`;
            }

            if(cateId){
                url = `${url}&category_id=${cateId}`;
            }

            let res = await Apis.get(url);
            if (res.data.next === null)
                setPage(0);

            if (page ===1)
                setDishes([...dishes, ...res.data.results]);
        }catch (ex) {

        } finally {
            setLoading(false);
        }

        useEffect(() => {
        let timer = setTimeout(() => {
            if (page > 0)
                loadDishes();
        }, 500);

        return () => clearTimeout(timer);
        }, [q, cateId, page]);

        useEffect(() => {
        setPage(1);
        }, [q, cateId]);

        
    }
    const loadMore = () => {
            if (page > 0 && !loading)
                setPage(page + 1);
    }

    return (
        <View>
            <SearchBar value={q} onChangeText={setQ}
                placeholder="Tìm món ăn..." />

            <FlatList onEndReached={loadMore} 
                    ListFooterComponent={loading && <ActivityIndicator />} 
                    data={dishes} renderItem={ ({item}) => <List.Item
                                                                    title={item.subject}
                                                                    description={item.created_date}
                                                                    left={() => <TouchableOpacity onPress={() => nav.navigate('Dishes', {'CateId': item.id})}>
                                                                        <Image style={Styles.avatar} source={{uri: item.image}} />
                                                                    </TouchableOpacity>}
                                                                />} />
            
        </View>
    );
}
export default Home
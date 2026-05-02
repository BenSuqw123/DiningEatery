import { useEffect, useState } from "react";
import { View, FlatList, Text, StyleSheet, RefreshControl } from "react-native";
import Apis, { endpoints } from "../../configs/Apis";
import TableCard from "../../components/Tables/TableCard";
import TableDetail from "../../components/Tables/TableDetail";

const Tables = () => {
    const [tables, setTables] = useState([]);
    const [selected, setSelected] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    const loadTables = async () => {
        let res = await Apis.get(endpoints['tables']);
        setTables(res.data.results ?? res.data);
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadTables();
        setRefreshing(false);
    };

    useEffect(() => { loadTables(); }, []);

    return (
        // <View style={styles.container}>
        //     <Text style={styles.title}>Quản lý bàn 🪑</Text>
        //     <Text style={styles.subtitle}>{tables.length} bàn</Text>

        //     <FlatList
        //         data={tables}
        //         keyExtractor={t => String(t.id)}
        //         renderItem={({ item }) => (
        //             <TableCard table={item} onPress={() => setSelected(item)} />
        //         )}
        //         contentContainerStyle={{ padding: 14 }}
        //         refreshControl={
        //             <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        //         }
        //     />

        //     {selected && (
        //         <TableDetail
        //             table={selected}
        //             visible={!!selected}
        //             onClose={() => setSelected(null)}
        //             onRefresh={() => { loadTables(); setSelected(null); }}
        //         />
        //     )}
        // </View>
        <Text>Bàn</Text>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f7f5f2", paddingTop: 50 },
    title: { fontSize: 22, fontWeight: "600", paddingHorizontal: 14, marginBottom: 2 },
    subtitle: { fontSize: 13, color: "#888", paddingHorizontal: 14, marginBottom: 4 },
});

export default Tables;
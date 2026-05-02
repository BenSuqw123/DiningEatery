// import { useEffect, useState } from "react";
// import { View, FlatList, Text, StyleSheet } from "react-native";
// import Apis, { endpoints } from "../../configs/Apis";
// import TableCard from "./TableCard";
// import TableDetail from "./TableDetail";

// const Tables = () => {
//     const [tables, setTables] = useState([]);
//     const [selected, setSelected] = useState(null);

//     const loadTables = async () => {
//         let res = await Apis.get(endpoints['tables']);
//         setTables(res.data.results ?? res.data);
//     };

//     useEffect(() => { loadTables(); }, []);

//     return (
//         <View style={styles.container}>
//             <Text style={styles.title}>Quản lý bàn</Text>

//             <FlatList
//                 data={tables}
//                 keyExtractor={t => String(t.id)}
//                 renderItem={({ item }) => (
//                     <TableCard table={item} onPress={() => setSelected(item)} />
//                 )}
//                 contentContainerStyle={{ padding: 14 }}
//             />

//             {selected && (
//                 <TableDetail
//                     table={selected}
//                     visible={!!selected}
//                     onClose={() => setSelected(null)}
//                     onRefresh={() => { loadTables(); setSelected(null); }}
//                 />
//             )}
//         </View>
//     );
// };

// const styles = StyleSheet.create({
//     container: { flex: 1, backgroundColor: "#f7f5f2", paddingTop: 50 },
//     title: { fontSize: 22, fontWeight: "600", paddingHorizontal: 14, marginBottom: 4 },
// });

// export default Tables;
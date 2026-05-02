// import { TouchableOpacity, Text, View, StyleSheet } from "react-native";
// import { Chip } from "react-native-paper";

// const STATUS_CONFIG = {
//     AVAILABLE: { label: "Trống", color: "#2E7D52", bg: "#EAF3DE" },
//     BOOKED:    { label: "Check-in", color: "#854F0B", bg: "#FAEEDA" },
//     OCCUPIED:  { label: "Đang ăn", color: "#993C1D", bg: "#FAECE7" },
// };

// const TableCard = ({ table, onPress }) => {
//     const s = STATUS_CONFIG[table.status] ?? STATUS_CONFIG.AVAILABLE;

//     return (
//         <TouchableOpacity style={[styles.card, { borderLeftColor: s.color }]} onPress={onPress}>
//             <View style={styles.row}>
//                 <Text style={styles.code}>Bàn {table.code}</Text>
//                 <View style={[styles.badge, { backgroundColor: s.bg }]}>
//                     <Text style={[styles.badgeText, { color: s.color }]}>{s.label}</Text>
//                 </View>
//             </View>
//             <Text style={styles.meta}>📍 {table.location}</Text>
//             <Text style={styles.meta}>👥 {table.capacity} chỗ ngồi</Text>
//         </TouchableOpacity>
//     );
// };

// const styles = StyleSheet.create({
//     card: {
//         backgroundColor: "#fff",
//         borderRadius: 10,
//         borderWidth: 0.5,
//         borderColor: "#ddd",
//         borderLeftWidth: 4,
//         padding: 14,
//         marginBottom: 10,
//     },
//     row: {
//         flexDirection: "row",
//         justifyContent: "space-between",
//         alignItems: "center",
//         marginBottom: 6,
//     },
//     code: { fontSize: 16, fontWeight: "600" },
//     badge: {
//         paddingHorizontal: 10,
//         paddingVertical: 3,
//         borderRadius: 20,
//     },
//     badgeText: { fontSize: 12, fontWeight: "500" },
//     meta: { fontSize: 13, color: "#888", marginTop: 2 },
// });

// export default TableCard;
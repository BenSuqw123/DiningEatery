// import { useEffect, useState, useContext } from "react";
// import {
//     Modal, View, Text, TouchableOpacity,
//     FlatList, TextInput, StyleSheet, Alert, ScrollView
// } from "react-native";
// import { Button, Chip } from "react-native-paper";
// import Apis, { endpoints, authApis } from "../../configs/Apis";
// import { MyUserContext } from "../../configs/Context";
// import OrderItem from "./OrderItem";

// const PAYMENT_METHODS = ["CASH", "MOMO", "STRIPE", "PAYPAL", "ZALOPAY"];

// const TableDetail = ({ table, visible, onClose, onRefresh }) => {
//     const user = useContext(MyUserContext);
//     const [dishes, setDishes] = useState([]);
//     const [invoice, setInvoice] = useState(null);
//     const [selectedDish, setSelectedDish] = useState(null);
//     const [quantity, setQuantity] = useState("1");
//     const [method, setMethod] = useState("CASH");
//     const [transactionId, setTransactionId] = useState("");
//     const [loading, setLoading] = useState(false);

//     const loadDishes = async () => {
//         let res = await Apis.get(endpoints['dishes']);
//         setDishes(res.data.results ?? res.data);
//     };

//     useEffect(() => {
//         if (visible) loadDishes();
//     }, [visible]);

//     const handleCheckin = async () => {
//         setLoading(true);
//         try {
//             await authApis(user.token).post(endpoints['checkin'](table.id));
//             Alert.alert("Thành công", `Check-in bàn ${table.code} thành công!`);
//             onRefresh();
//         } catch (e) {
//             Alert.alert("Lỗi", e.response?.data?.error ?? "Có lỗi xảy ra");
//         } finally {
//             setLoading(false);
//         }
//     };

//     const handleOrder = async () => {
//         if (!selectedDish) return Alert.alert("Chưa chọn món");
//         setLoading(true);
//         try {
//             await authApis(user.token).post(endpoints['order'](table.id), {
//                 dish_id: selectedDish.id,
//                 quantity: parseInt(quantity) || 1,
//             });
//             Alert.alert("Đã thêm", `${selectedDish.name} x${quantity}`);
//             setSelectedDish(null);
//             setQuantity("1");
//             onRefresh();
//         } catch (e) {
//             Alert.alert("Lỗi", e.response?.data?.error ?? "Có lỗi xảy ra");
//         } finally {
//             setLoading(false);
//         }
//     };

//     const handleCheckout = async () => {
//         setLoading(true);
//         try {
//             await authApis(user.token).post(endpoints['checkout'](table.id), {
//                 method,
//                 transaction: transactionId || null,
//             });
//             Alert.alert("Thanh toán thành công!");
//             onClose();
//             onRefresh();
//         } catch (e) {
//             Alert.alert("Lỗi", e.response?.data?.error ?? "Có lỗi xảy ra");
//         } finally {
//             setLoading(false);
//         }
//     };

//     const isAvailable = table?.status === "AVAILABLE";
//     const isActive    = table?.status === "BOOKED" || table?.status === "OCCUPIED";

//     return (
//         <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
//             <ScrollView style={styles.container}>
//                 <View style={styles.header}>
//                     <Text style={styles.title}>Bàn {table?.code}</Text>
//                     <TouchableOpacity onPress={onClose}>
//                         <Text style={styles.close}>✕</Text>
//                     </TouchableOpacity>
//                 </View>

//                 {/* CHECK-IN */}
//                 {isAvailable && (
//                     <Button mode="contained" onPress={handleCheckin}
//                         loading={loading} style={styles.btn}>
//                         Check-in bàn này
//                     </Button>
//                 )}

//                 {/* GỌI MÓN */}
//                 {isActive && (
//                     <View style={styles.section}>
//                         <Text style={styles.sectionTitle}>Gọi món</Text>
//                         <ScrollView horizontal showsHorizontalScrollIndicator={false}
//                             style={{ marginBottom: 8 }}>
//                             {dishes.map(d => (
//                                 <TouchableOpacity key={d.id} onPress={() => setSelectedDish(d)}>
//                                     <Chip
//                                         style={[styles.dishChip,
//                                             selectedDish?.id === d.id && styles.dishChipSelected]}
//                                         textStyle={selectedDish?.id === d.id && { color: "#fff" }}
//                                     >
//                                         {d.name} - {Number(d.price).toLocaleString()}đ
//                                     </Chip>
//                                 </TouchableOpacity>
//                             ))}
//                         </ScrollView>

//                         <View style={styles.row}>
//                             <TextInput
//                                 style={styles.qtyInput}
//                                 value={quantity}
//                                 onChangeText={setQuantity}
//                                 keyboardType="numeric"
//                                 placeholder="Số lượng"
//                             />
//                             <Button mode="contained" onPress={handleOrder}
//                                 loading={loading} style={{ flex: 1 }}>
//                                 Thêm món
//                             </Button>
//                         </View>
//                     </View>
//                 )}

//                 {/* THANH TOÁN */}
//                 {isActive && (
//                     <View style={styles.section}>
//                         <Text style={styles.sectionTitle}>Thanh toán</Text>

//                         <ScrollView horizontal showsHorizontalScrollIndicator={false}
//                             style={{ marginBottom: 10 }}>
//                             {PAYMENT_METHODS.map(m => (
//                                 <TouchableOpacity key={m} onPress={() => setMethod(m)}>
//                                     <Chip
//                                         style={[styles.dishChip,
//                                             method === m && styles.dishChipSelected]}
//                                         textStyle={method === m && { color: "#fff" }}
//                                     >
//                                         {m}
//                                     </Chip>
//                                 </TouchableOpacity>
//                             ))}
//                         </ScrollView>

//                         {method !== "CASH" && (
//                             <TextInput
//                                 style={styles.input}
//                                 placeholder="Mã giao dịch"
//                                 value={transactionId}
//                                 onChangeText={setTransactionId}
//                             />
//                         )}

//                         <Button mode="contained" buttonColor="#C25B3D"
//                             onPress={handleCheckout} loading={loading} style={styles.btn}>
//                             Xác nhận thanh toán
//                         </Button>
//                     </View>
//                 )}
//             </ScrollView>
//         </Modal>
//     );
// };

// const styles = StyleSheet.create({
//     container: { flex: 1, padding: 16, paddingTop: 50 },
//     header: {
//         flexDirection: "row", justifyContent: "space-between",
//         alignItems: "center", marginBottom: 20,
//     },
//     title: { fontSize: 22, fontWeight: "600" },
//     close: { fontSize: 20, color: "#888" },
//     section: {
//         backgroundColor: "#fff", borderRadius: 10,
//         borderWidth: 0.5, borderColor: "#ddd",
//         padding: 14, marginBottom: 14,
//     },
//     sectionTitle: { fontSize: 15, fontWeight: "600", marginBottom: 10 },
//     row: { flexDirection: "row", gap: 8, alignItems: "center" },
//     btn: { marginBottom: 14 },
//     qtyInput: {
//         borderWidth: 0.5, borderColor: "#ccc", borderRadius: 8,
//         padding: 8, width: 80, fontSize: 14,
//     },
//     input: {
//         borderWidth: 0.5, borderColor: "#ccc", borderRadius: 8,
//         padding: 10, fontSize: 14, marginBottom: 10,
//     },
//     dishChip: { margin: 4, backgroundColor: "#f0f0f0" },
//     dishChipSelected: { backgroundColor: "#C25B3D" },
// });

// export default TableDetail;
import { useContext, useEffect, useState } from "react";
import { View, Text, Image, Alert, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { Button, TextInput } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import { MyUserContext } from "../../configs/MyContext";
import { authApis, endpoints } from "../../configs/Apis";
import Apis from "../../configs/Apis";
import { useNavigation, useRoute } from "@react-navigation/native";

const CreateDish = () => {
    const [user] = useContext(MyUserContext);
    const nav = useNavigation();
    const route = useRoute();
    const editingDish = route.params?.dish ?? null;
    const isEdit = !!editingDish;
    const stripHtml = (html) => html?.replace(/<[^>]*>/g, '') ?? '';

    const [form, setForm] = useState({
        name:        editingDish?.name        ?? "",
        description: editingDish?.description ?? "",
        price:       editingDish?.price       ?? "",
        time_served: editingDish?.time_served?.toString() ?? "",
        category_id: editingDish?.category    ?? "",
    });
    const [image, setImage] = useState(null);
    const [ingredients, setIngredients] = useState(
        editingDish?.ingredients?.map(i => ({ name: i.ingredient?.name, quantity: i.quantity })) ??
        [{ name: "", quantity: "" }]
    );
    const [categories, setCategories] = useState([]);
    const [chefs, setChefs] = useState([]);
    const [selectedChefs, setSelectedChefs] = useState(
        editingDish?.chefs?.map(c => c.id).filter(id => id !== user?.id) ?? []
    );
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const load = async () => {
            const [catRes, chefRes] = await Promise.all([
                Apis.get(endpoints["categories"]),
                Apis.get(endpoints["chefs"]),
            ]);
            setCategories(catRes.data.results ?? catRes.data);
            setChefs(chefRes.data.results ?? chefRes.data);
        };
        load();
    }, []);

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") return;
        const result = await ImagePicker.launchImageLibraryAsync();
        if (!result.canceled) setImage(result.assets[0]);
    };

    const handleSave = async () => {
        if (!form.name || !form.price) return Alert.alert("Lỗi", "Vui lòng nhập tên và giá món");
        try {
            setSaving(true);
            const token = await AsyncStorage.getItem("token");

            // Upload ảnh nếu có ảnh mới
            let imageUrl = null;
            if (image) {
                const imgData = new FormData();
                imgData.append("file", { uri: image.uri, type: image.mimeType || "image/jpeg", name: "upload.jpg" });
                imgData.append("upload_preset", process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET);
                imgData.append("cloud_name",    process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME);
                const res = await axios.post(
                    `https://api.cloudinary.com/v1_1/${process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
                    imgData, { headers: { "Content-Type": "multipart/form-data" } }
                );
                imageUrl = res.data.secure_url;
            }

            // Tạo ingredient (hướng 2)
            const ingredientIds = [];
            for (let ing of ingredients.filter(i => i.name.trim())) {
                const res = await authApis(token).post(endpoints["ingredients"], { name: ing.name });
                ingredientIds.push({ ingredient_id: res.data.id, quantity: ing.quantity });
            }

            const data = new FormData();
            Object.entries(form).forEach(([k, v]) => v && data.append(k, String(v)));
            data.append("ingredients", JSON.stringify(ingredientIds));
            data.append("chef_ids",    JSON.stringify(selectedChefs));
            if (imageUrl) data.append("image", imageUrl);

            if (isEdit) {
                await authApis(token).patch(`${endpoints["dishes"]}${editingDish.id}/update/`, data, {
                    headers: { "Content-Type": "multipart/form-data" }
            });
                Alert.alert("Thành công", "Cập nhật món thành công!");
            } else {
                await authApis(token).post(endpoints["dishes"], data, {
                    headers: { "Content-Type": "multipart/form-data" }
                });
                Alert.alert("Thành công", "Tạo món thành công!");
            }
            nav.goBack();
        } catch (e) {
            console.error("handleSave error:", e?.response?.status, e?.response?.data);
            Alert.alert("Lỗi", e?.response?.data?.error ?? "Không thể lưu món");
        } finally { setSaving(false); }
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }} keyboardShouldPersistTaps="handled">
                <Text style={{ fontSize: 18, fontWeight: 'bold' }}>{isEdit ? "Chỉnh sửa món" : "Tạo món mới"}</Text>

                {/* Ảnh */}
                <Button mode="outlined" icon="image" onPress={pickImage}>
                Chọn Ảnh Món Ăn
                </Button>
                {(image || editingDish?.image) && (
                    <Image source={{ uri: image?.uri ?? editingDish?.image }}
                        style={{ width: '100%', height: 160, borderRadius: 8 }} resizeMode="cover" />
                )}

                <TextInput mode="outlined" label="Tên món *" value={form.name}
                    onChangeText={t => setForm({ ...form, name: t })} />
                <TextInput mode="outlined" label="Mô tả"  value={stripHtml(form.description)}
                    onChangeText={t => setForm({ ...form, description: t })} multiline />
                <TextInput mode="outlined" label="Giá (đ) *" value={String(form.price)}
                    onChangeText={t => setForm({ ...form, price: t })} keyboardType="numeric" />
                <TextInput mode="outlined" label="Thời gian (phút)" value={String(form.time_served)}
                    onChangeText={t => setForm({ ...form, time_served: t })} keyboardType="numeric" />

                {/* Danh mục */}
                <Text style={{ fontWeight: '600' }}>Danh mục</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {categories.map(c => (
                        <Button key={c.id} compact
                            mode={form.category_id == c.id ? "contained" : "outlined"}
                            onPress={() => setForm({ ...form, category_id: c.id })}>
                            {c.name}
                        </Button>
                    ))}
                </View>

                {/* Đầu bếp đồng phụ trách */}
                <Text style={{ fontWeight: '600' }}>Đầu bếp đồng phụ trách</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {chefs.filter(c => c.id !== user?.id).map(c => {
                        const isSelected = selectedChefs.includes(c.id);
                        return (
                            <Button key={c.id} compact
                                mode={isSelected ? "contained" : "outlined"}
                                onPress={() => setSelectedChefs(prev =>
                                    isSelected ? prev.filter(id => id !== c.id) : [...prev, c.id]
                                )}>
                                {c.first_name} {c.last_name}
                            </Button>
                        );
                    })}
                    {chefs.filter(c => c.id !== user?.id).length === 0 &&
                        <Text style={{ color: '#888', fontSize: 13 }}>Không có đầu bếp khác</Text>}
                </View>

                {/* Nguyên liệu */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontWeight: '600' }}>Nguyên liệu</Text>
                    <Button compact onPress={() => setIngredients(p => [...p, { name: "", quantity: "" }])}>+ Thêm</Button>
                </View>
                {ingredients.map((ing, idx) => (
                    <View key={idx} style={{ flexDirection: 'row', gap: 8 }}>
                        <TextInput mode="outlined" label="Tên" value={ing.name} style={{ flex: 1 }}
                            onChangeText={t => setIngredients(p => p.map((it, i) => i === idx ? { ...it, name: t } : it))} />
                        <TextInput mode="outlined" label="Số Lượng" value={ing.quantity} style={{ width: 80 }}
                            onChangeText={t => setIngredients(p => p.map((it, i) => i === idx ? { ...it, quantity: t } : it))} />
                        <Button compact onPress={() => setIngredients(p => p.filter((_, i) => i !== idx))}>✕</Button>
                    </View>
                ))}

                <Button mode="contained" loading={saving} onPress={handleSave} style={{ marginTop: 8 }}>
                    {isEdit ? "Lưu thay đổi" : "Tạo món"}
                </Button>
                <Button mode="outlined" onPress={() => nav.goBack()}>Hủy</Button>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

export default CreateDish;
import { Image, Text, View, ScrollView, TouchableOpacity } from "react-native";
import { Button, TextInput } from "react-native-paper";
import { useContext, useState } from "react";
import { MyUserContext } from "../../configs/MyContext";
import { authApis, endpoints } from "../../configs/Apis";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ROLE_LABEL = {
    CUSTOMER: { label: "Khách hàng", color: "#0ea5e9", bg: "#e0f2fe" },
    CHEF:     { label: "Đầu bếp",   color: "#f59e0b", bg: "#fef3c7" },
    ADMIN:    { label: "Quản trị",  color: "#8b5cf6", bg: "#ede9fe" },
};

const UserProfile = () => {
    const [user, dispatch] = useContext(MyUserContext);
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({});
    const [loading, setLoading] = useState(false);

    if (!user) return null;

    const role = ROLE_LABEL[user.role];

    const save = async () => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem('token');
            const res = await authApis(token).patch(endpoints['current_user'], form, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            dispatch({ type: "login", payload: res.data });
            setEditing(false);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={{ padding: 24 }}>
            <View style={{ alignItems: 'center', marginBottom: 24 }}>
                <Image
                    source={{ uri: user.avatar || "https://i.pravatar.cc/300" }}
                    style={{ width: 90, height: 90, borderRadius: 45, marginBottom: 12 }} />
                <Text style={{ fontSize: 20, fontWeight: 'bold' }}>{user.first_name} {user.last_name}</Text>
                <View style={{ backgroundColor: role.bg, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginTop: 6 }}>
                    <Text style={{ color: role.color, fontWeight: '600' }}>{role.label}</Text>
                </View>
            </View>

            {editing ? (
                <View style={{ gap: 12 }}>
                    <TextInput mode="outlined" label="Họ" value={form.first_name ?? user.first_name}
                        onChangeText={t => setForm({ ...form, first_name: t })} />
                    <TextInput mode="outlined" label="Tên" value={form.last_name ?? user.last_name}
                        onChangeText={t => setForm({ ...form, last_name: t })} />
                    <TextInput mode="outlined" label="Email" value={form.email ?? user.email ?? ''}
                        onChangeText={t => setForm({ ...form, email: t })}
                        keyboardType="email-address" />
                    <Button mode="contained" loading={loading} onPress={save}>Lưu</Button>
                    <Button mode="outlined" onPress={() => { setEditing(false); setForm({}); }}>Hủy</Button>
                </View>
            ) : (
                <View style={{ backgroundColor: '#f9fafb', borderRadius: 12, padding: 16, gap: 12, marginBottom: 16 }}>
                    {[  { label: 'Họ và tên', value: `${user.first_name} ${user.last_name}` },
                        { label: 'Tên đăng nhập', value: user.username },
                        { label: 'Email', value: user.email || 'Chưa cập nhật' },
                    ].map((row, i) => (
                        <View key={i}>
                            <Text style={{ color: '#888', fontSize: 12 }}>{row.label}</Text>
                            <Text style={{ fontWeight: '600', marginTop: 2 }}>{row.value}</Text>
                            {i < 2 && <View style={{ height: 1, backgroundColor: '#e5e7eb', marginTop: 10 }} />}
                        </View>
                    ))}
                </View>
            )}

            {!editing && (
                <>
                    <Button mode="outlined" onPress={() => setEditing(true)} style={{ marginBottom: 12 }}>Chỉnh sửa</Button>
                    <Button mode="contained" buttonColor="#ef4444" onPress={() => dispatch({ type: "logout" })}>Đăng xuất</Button>
                </>
            )}
        </ScrollView>
    );
};

export default UserProfile;
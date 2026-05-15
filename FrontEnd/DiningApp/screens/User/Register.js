import { Alert, Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Button, HelperText, TextInput } from "react-native-paper";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import Apis, { endpoints } from "../../configs/Apis";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";

const Register = () => {
    const fields = [
        { title: "Tên", field: "first_name", icon: "text" },
        { title: "Họ và tên lót", field: "last_name", icon: "text" },
        { title: "Tên đăng nhập", field: "username", icon: "account" },
        { title: "Email", field: "email", icon: "email" },
        { title: "Mật khẩu", field: "password", icon: "eye", secureTextEntry: true },
        { title: "Xác nhận mật khẩu", field: "confirm", icon: "eye", secureTextEntry: true },
    ];

    const [user, setUser] = useState({});
    const [err, setErr] = useState("");
    const [loading, setLoading] = useState(false);
    const nav = useNavigation();

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") return;

        const result = await ImagePicker.launchImageLibraryAsync();
        if (!result.canceled) setUser({ ...user, avatar: result.assets[0] });
    };

    const register = async () => {
        for (let f of fields)
            if (!user[f.field]) return setErr(`Vui lòng nhập ${f.title}!`);

        if (user.password !== user.confirm) return setErr("Mật khẩu không khớp");

        setErr("");
        try {
            setLoading(true);

            let avatarUrl = null;
            if (user.avatar) {
                const data = new FormData();
                data.append("file", {
                    uri: user.avatar.uri,
                    type: user.avatar.mimeType || "image/jpeg",
                    name: "upload.jpg",
                });
                data.append("upload_preset", process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET);
                data.append("cloud_name", process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME);

                const res = await axios.post(
                    `https://api.cloudinary.com/v1_1/${process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
                    data,
                    { headers: { "Content-Type": "multipart/form-data" } }
                );
                avatarUrl = res.data.secure_url;
            }

            const form = new FormData();
            for (let key in user)
                if (key !== "confirm" && key !== "avatar") form.append(key, user[key]);
            if (avatarUrl) form.append("avatar", avatarUrl);

            const res = await Apis.post(endpoints["register"], form, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            if (res.status === 201) nav.navigate("login");
        } catch {
            Alert.alert("Lỗi đăng ký", "Vui lòng kiểm tra lại thông tin!");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 24 }}>
            <Text style={{ fontSize: 28, fontWeight: "bold", textAlign: "center", marginBottom: 4 }}>Đăng ký</Text>
            <Text style={{ textAlign: "center", color: "#888", marginBottom: 32 }}>Tạo tài khoản mới để trải nghiệm</Text>

            {err ? <HelperText type="error" visible>{err}</HelperText> : null}

            {fields.map((f) => (
                <TextInput
                    key={f.field}
                    mode="outlined"
                    label={f.title}
                    value={user[f.field]}
                    onChangeText={(t) => setUser({ ...user, [f.field]: t })}
                    secureTextEntry={f.secureTextEntry}
                    right={<TextInput.Icon icon={f.icon} />}
                    style={{ marginBottom: 12 }}
                />
            ))}

            <TouchableOpacity
                onPress={pickImage}
                style={{
                    borderWidth: 1,
                    borderColor: "#e5e7eb",
                    borderStyle: "dashed",
                    borderRadius: 8,
                    padding: 14,
                    alignItems: "center",
                    marginBottom: 12,
                }}
            >
                <Text style={{ color: "#0ea5e9", fontWeight: "600" }}>
                    Chọn ảnh đại diện
                </Text>
            </TouchableOpacity>

            {user.avatar && (
                <View style={{ alignItems: "center", marginBottom: 12 }}>
                    <Image
                        source={{ uri: user.avatar.uri }}
                        style={{ width: 90, height: 90, borderRadius: 45, borderWidth: 2, borderColor: "#0ea5e9" }}
                    />
                </View>
            )}

            <Button mode="contained" loading={loading} disabled={loading} onPress={register} style={{ marginTop: 8 }}>
                Đăng ký ngay
            </Button>

            <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 20 }}>
                <Text>Đã có tài khoản? </Text>
                <TouchableOpacity onPress={() => nav.navigate("login")}>
                    <Text style={{ color: "#0ea5e9", fontWeight: "bold" }}>Đăng nhập</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

export default Register;

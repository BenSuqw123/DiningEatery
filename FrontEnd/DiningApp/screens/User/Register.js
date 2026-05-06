import { Image, KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Button, HelperText, TextInput } from "react-native-paper";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import Apis, { endpoints } from "../../configs/Apis";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import LoginStyle from "./LoginStyle";
import { useAlert } from "../../configs/AlertContext";

const Register = () => {
  const info = [
    { title: "Tên",            field: "first_name", icon: "text" },
    { title: "Họ và tên lót",  field: "last_name",  icon: "text" },
    { title: "Tên đăng nhập",  field: "username",   icon: "account" },
    { title: "Email",          field: "email",      icon: "email" },
    { title: "Mật khẩu",       field: "password",   icon: "eye", secureTextEntry: true },
    { title: "Xác nhận mật khẩu", field: "confirm", icon: "eye", secureTextEntry: true },
  ];

  const [user, setUser] = useState({});
  const [err, setErr] = useState(false);
  const [loading, setLoading] = useState(false);
  const showAlert = useAlert();
  const nav = useNavigation();

  const uploadToCloudinary = async (file) => {
    if (!file) return null;
    const data = new FormData();
    data.append("file", { uri: file.uri, type: file.mimeType || "image/jpeg", name: file.fileName || "upload.jpg" });
    data.append("upload_preset", "diningapp");
    data.append("cloud_name", "dfgicbdji");
    try {
      const res = await axios.post("https://api.cloudinary.com/v1_1/dfgicbdji/image/upload", data,
        { headers: { "Content-Type": "multipart/form-data" } });
      return res.data.secure_url;
    } catch {
      return null;
    }
  };

  const pickImage = async () => {
    let { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") { alert("Permissions denied!"); return; }
    const result = await ImagePicker.launchImageLibraryAsync();
    if (!result.canceled) setUser({ ...user, avatar: result.assets[0] });
  };

  const validate = () => {
    for (var i of info)
      if (!(i.field in user) || !user[i.field]) {
        setErr(`Vui lòng nhập ${i.title}!`);
        return false;
      }
    if (user.password !== user.confirm) { setErr("Mật khẩu không khớp"); return false; }
    return true;
  };

  const register = async () => {
    if (validate() === true) {
      try {
        setLoading(true);
        let avatarUrl = null;
        if (user.avatar) {
          avatarUrl = await uploadToCloudinary(user.avatar);
          if (!avatarUrl) {
            showAlert("Lỗi hệ thống", "Không thể upload ảnh. Vui lòng thử lại.", "error");
            return;
          }
        }
        let form = new FormData();
        for (let key in user)
          if (key !== "confirm" && key !== "avatar") form.append(key, user[key]);
        if (avatarUrl) form.append("avatar", avatarUrl);

        let res = await Apis.post(endpoints["register"], form, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        if (res.status === 201) nav.navigate("login");
      } catch {
        showAlert("Lỗi đăng ký", "Vui lòng kiểm tra lại thông tin!", "error");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={LoginStyle.container}>
      <ScrollView contentContainerStyle={LoginStyle.scrollContent} showsVerticalScrollIndicator={false}>

        <View style={LoginStyle.banner}>
          <Text style={LoginStyle.title}>ĐĂNG KÝ</Text>
          <Text style={LoginStyle.subtitle}>Tạo tài khoản mới để trải nghiệm</Text>
        </View>

        <View style={LoginStyle.content}>
          {err && <HelperText type="error" visible={!!err}>{err}</HelperText>}

          {info.map((i) => (
            <View key={i.field}>
              <TextInput
                mode="outlined"
                outlineColor="#e5e7eb"
                activeOutlineColor="#0ea5e9"
                placeholder={`Nhập ${i.title.toLowerCase()}`}
                style={LoginStyle.input}
                value={user[i.field]}
                onChangeText={(t) => setUser({ ...user, [i.field]: t })}
                secureTextEntry={i.secureTextEntry}
                right={<TextInput.Icon icon={i.icon} color="#94a3b8" />}
              />
            </View>
          ))}

          <TouchableOpacity
            style={{ borderWidth: 1, borderColor: "#e5e7eb", borderStyle: "dashed",
              borderRadius: 12, padding: 14, alignItems: "center", marginBottom: 16, backgroundColor: "#fff" }}
            onPress={pickImage}
          >
            <Text style={{ color: "#0ea5e9", fontWeight: "600" }}>
              {user.avatar ? "Thay đổi ảnh đại diện" : "Chọn ảnh từ thư viện..."}
            </Text>
          </TouchableOpacity>

          {user.avatar && (
            <View style={{ alignItems: "center", marginBottom: 16 }}>
              <Image source={{ uri: user.avatar.uri }}
                style={{ width: 100, height: 100, borderRadius: 50, borderWidth: 2, borderColor: "#0ea5e9" }} />
            </View>
          )}

          <Button loading={loading} disabled={loading} mode="contained"
            onPress={register} contentStyle={{ height: 52 }}
            style={LoginStyle.loginButton} labelStyle={LoginStyle.loginButtonText}
            buttonColor="#0ea5e9" icon="account-plus">
            Đăng ký ngay
          </Button>

          <View style={LoginStyle.signupContainer}>
            <Text style={LoginStyle.signupText}>Đã có tài khoản? </Text>
            <TouchableOpacity onPress={() => nav.navigate("login")}>
              <Text style={LoginStyle.signupLink}>Đăng nhập</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default Register;
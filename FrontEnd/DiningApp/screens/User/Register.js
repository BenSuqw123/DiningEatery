import {Alert,Image,KeyboardAvoidingView,Platform,ScrollView,Text,TouchableOpacity,View,} from "react-native";
import Style from "../../styles/Styles";
import { Button, HelperText, TextInput } from "react-native-paper";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import Apis, { endpoints } from "../../configs/Apis";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import RegisterStyle from "./RegisterStyle";
import { useAlert } from "../../configs/AlertContext";

const Register = () => {
  const info = [
    {
      title: "Tên",
      field: "first_name",
      icon: "text",
    },
    {
      title: "Họ và tên lót",
      field: "last_name",
      icon: "text",
    },
    {
      title: "Tên đăng nhập",
      field: "username",
      icon: "account",
    },
    {
      title: "Email",
      field: "email",
      icon: "email",
    },
    {
      title: "Sđt",
      field: "phone",
      icon: "phone",
    },
    {
      title: "Mật khẩu",
      field: "password",
      icon: "eye",
      secureTextEntry: true,
    },
    {
      title: "Xác nhận mật khẩu",
      field: "confirm",
      icon: "eye",
      secureTextEntry: true,
    },
  ];

  const [user, setUser] = useState({});
  const [err, setErr] = useState(false);
  const [loading, setLoading] = useState(false);
  const showAlert = useAlert();
  const nav = useNavigation();

  const uploadToCloudinary = async (file) => {
    if (!file) return null;
    const data = new FormData();
    data.append("file", {
      uri: file.uri,
      type: file.mimeType || "image/jpeg",
      name: file.fileName || "upload.jpg",
    });
    data.append("upload_preset", "courseapp_preset");
    data.append("cloud_name", "dpl8syyb9");

    try {
      const res = await axios.post(
        "https://api.cloudinary.com/v1_1/dpl8syyb9/image/upload",
        data,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      return res.data.secure_url;
    } catch (error) {
      console.error("Lỗi upload ảnh:", error);
      return null;
    }
  };

  const pickImage = async () => {
    let { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      alert("Permissions denied!");
    } else {
      const result = await ImagePicker.launchImageLibraryAsync();
      if (!result.canceled) {
        setUser({ ...user, avatar: result.assets[0] });
      }
    }
  };

  const validate = () => {
    if (!user.password || user.password !== user.confirm) {
      setErr(true);
      return false;
    }
    //...

    setErr(false);
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
            showAlert(
              "Lỗi hệ thống",
              "Không thể upload ảnh. Vui lòng thử lại.",
              "error"
            );
            setLoading(false);
            return;
          }
        }
        let form = new FormData();
        for (let key in user)
          if (key !== "confirm" && key !== "avatar") {
            form.append(key, user[key]);
          }

        if (avatarUrl) {
          form.append("avatar", avatarUrl);
        }
        console.info(user);

        let res = await Apis.post(endpoints["register"], form, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        if (res.status === 201) {
          showAlert(
            "Thành công",
            "Đăng ký thành công! Vui lòng đăng nhập.",
            "success"
          );
          nav.navigate("Login");
        }
      } catch (ex) {
        showAlert(
          "Lỗi đăng ký",
          "Mật khẩu không đúng. Vui lòng thử lại!",
          "error"
        );
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={RegisterStyle.container}
    >
      <ScrollView
        contentContainerStyle={RegisterStyle.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={RegisterStyle.content}>
          <View style={RegisterStyle.header}>
            <Text style={RegisterStyle.title}>ĐĂNG KÝ</Text>
            <Text style={RegisterStyle.subtitle}>
              Tạo tài khoản mới để trải nghiệm
            </Text>
          </View>

          <View style={RegisterStyle.form}>
            <HelperText type="error" visible={err} style={{ marginBottom: 8 }}>
              Mật khẩu KHÔNG khớp!
            </HelperText>

            {info.map((i) => (
              <View key={i.field} style={RegisterStyle.inputContainer}>
                <TextInput
                  mode="outlined"
                  outlineColor="#e5e7eb"
                  activeOutlineColor="#2563eb"
                  placeholder={`Nhập ${i.title.toLowerCase()}`}
                  style={{ backgroundColor: "#f9fafb" }}
                  value={user[i.field]}
                  onChangeText={(t) => setUser({ ...user, [i.field]: t })}
                  secureTextEntry={i.secureTextEntry}
                  right={<TextInput.Icon icon={i.icon} color="#6b7280" />}
                />
              </View>
            ))}

            <View style={RegisterStyle.inputContainer}>
              <Text style={RegisterStyle.label}>Ảnh đại diện</Text>
              <TouchableOpacity
                style={[
                  RegisterStyle.inputWrapper,
                  { borderStyle: "dashed", justifyContent: "center" },
                ]}
                onPress={pickImage}
              >
                <Text style={{ color: "#2563eb", fontWeight: "500" }}>
                  {user.avatar
                    ? "Thay đổi ảnh đại diện"
                    : "Chọn ảnh từ thư viện..."}
                </Text>
              </TouchableOpacity>
            </View>

            {user.avatar && (
              <View style={{ alignItems: "center", marginBottom: 20 }}>
                <Image
                  source={{ uri: user.avatar.uri }}
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: 50,
                    borderWidth: 2,
                    borderColor: "#2563eb",
                  }}
                />
              </View>
            )}

            <Button
              loading={loading}
              disabled={loading}
              mode="contained"
              onPress={register}
              contentStyle={{ height: 56 }}
              style={RegisterStyle.registerButton}
              labelStyle={RegisterStyle.registerButtonText}
              icon="account-plus"
            >
              Đăng ký ngay
            </Button>

            <View style={RegisterStyle.loginContainer}>
              <Text style={RegisterStyle.loginText}>Đã có tài khoản? </Text>
              <TouchableOpacity onPress={() => nav.navigate("Login")}>
                <Text style={RegisterStyle.loginLink}>Đăng nhập</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default Register;
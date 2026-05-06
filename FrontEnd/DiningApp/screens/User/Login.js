import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, Image } from "react-native";
import { Button, HelperText, TextInput } from "react-native-paper";
import { useContext, useState } from "react";
import Apis, { authApis, CLIENT_ID, CLIENT_SECRET, endpoints } from "../../configs/Apis";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MyUserContext } from "../../configs/MyContext";
import { useAlert } from "../../configs/AlertContext";
import LoginStyle from "./LoginStyle";
import { ScrollView } from "react-native";

const Login = () => {
    const userInfo = [
        { field: 'username', label: 'Tên đăng nhập', icon: 'account' },
        { field: 'password', label: 'Mật khẩu', icon: 'eye', secureTextEntry: true }
    ];

    const [user, setUser] = useState({});
    const [err, setErr] = useState();
    const [loading, setLoading] = useState(false);
    const nav = useNavigation();
    const [, dispatch] = useContext(MyUserContext);
    const showAlert = useAlert();

    const validate = () => {
        for (var i of userInfo)
            if (!(i.field in user) || !user[i.field]) {
                setErr(`Vui lòng nhập ${i.label}!`);
                return false;
            }
        return true;
    }

    const login = async () => {
        if (validate() === true) {
            setErr("");
            try {
                setLoading(true);
                let res = await Apis.post(endpoints['login'],
                    `grant_type=password&username=${user.username}&password=${user.password}&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}`,
                    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
                );

                await AsyncStorage.setItem('token', res.data.access_token);
                let u = await authApis(res.data.access_token).get(endpoints['current_user']);
                dispatch({ type: "login", payload: u.data });
                showAlert("Thành công", "Đăng nhập thành công!", "success");

            } catch (ex) {
                console.error(ex);
                showAlert("Lỗi đăng nhập", "Tên đăng nhập hoặc mật khẩu không đúng!", "error");
            } finally {
                setLoading(false);
            }
        }
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={LoginStyle.container}
        >
            <ScrollView contentContainerStyle={LoginStyle.scrollContent}
                        showsVerticalScrollIndicator={false}>

                <View style={LoginStyle.banner}>
                    <Text style={LoginStyle.title}>DinningEatery</Text>
                    <Text style={LoginStyle.subtitle}>Đăng nhập để tiếp tục trải nghiệm</Text>
                </View>

                <View style={LoginStyle.content}>
                    {err && <HelperText type="error" visible={!!err}>{err}</HelperText>}

                    {userInfo.map(i =>
                        <TextInput key={i.field} mode="outlined" outlineColor="#e5e7eb" activeOutlineColor="#0ea5e9" style={LoginStyle.input} value={user[i.field]} onChangeText={t => setUser({ ...user, [i.field]: t })} label={i.label} secureTextEntry={i.secureTextEntry} right={<TextInput.Icon icon={i.icon} color="#94a3b8" />}/>
                    )}

                    <Button loading={loading} disabled={loading} onPress={login} mode="contained" buttonColor="#0ea5e9" 
                    contentStyle={{height:52 }} style={LoginStyle.loginButton} labelStyle={LoginStyle.loginButtonText} icon="login" >
                        Đăng nhập
                    </Button>

                    <View style={LoginStyle.signupContainer}>
                        <Text style={LoginStyle.signupText}>Chưa có tài khoản? </Text>
                        <TouchableOpacity onPress={() => nav.navigate("register")}>
                            <Text style={LoginStyle.signupLink}>Đăng ký ngay</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

export default Login;
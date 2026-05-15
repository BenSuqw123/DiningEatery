import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { Button, HelperText, TextInput } from "react-native-paper";
import { useContext, useState } from "react";
import Apis, { authApis, CLIENT_ID, CLIENT_SECRET, endpoints } from "../../configs/Apis";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MyUserContext } from "../../configs/MyContext";
import { useAlert } from "../../configs/AlertContext";

const Login = () => {
    const fields = [
        { field: 'username', label: 'Tên đăng nhập', icon: 'account' },
        { field: 'password', label: 'Mật khẩu', icon: 'eye', secureTextEntry: true }
    ];

    const [user, setUser] = useState({});
    const [err, setErr] = useState();
    const [loading, setLoading] = useState(false);
    const nav = useNavigation();
    const [, dispatch] = useContext(MyUserContext);
    const showAlert = useAlert();

    const login = async () => {
        for (let f of fields)
            if (!user[f.field]) return setErr(`Vui lòng nhập ${f.label}!`);
        setErr("");
        try {
            setLoading(true);
            const res = await Apis.post(endpoints['login'],
                `grant_type=password&username=${user.username}&password=${user.password}&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}`,
                { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
            );
            await AsyncStorage.setItem('token', res.data.access_token);
            const u = await authApis(res.data.access_token).get(endpoints['current_user']);
            dispatch({ type: "login", payload: u.data });
            showAlert("Thành công", "Đăng nhập thành công!", "success");
        } catch {
            showAlert("Lỗi", "Tên đăng nhập hoặc mật khẩu không đúng!", "error");
        } finally {
            setLoading(false);
        }
    }

    return (
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
            <Text style={{ fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 4 }}>DiningEatery</Text>
            <Text style={{ textAlign: 'center', color: '#888', marginBottom: 32 }}>Đăng nhập để tiếp tục</Text>

            {err && <HelperText type="error" visible={!!err}>{err}</HelperText>}

            {fields.map(f =>
                <TextInput key={f.field} mode="outlined" label={f.label}
                    value={user[f.field]} onChangeText={t => setUser({ ...user, [f.field]: t })}
                    secureTextEntry={f.secureTextEntry}
                    right={<TextInput.Icon icon={f.icon} />}
                    style={{ marginBottom: 12 }} />
            )}

            <Button mode="contained" loading={loading} disabled={loading}
                onPress={login} style={{ marginTop: 8 }}>
                Đăng nhập
            </Button>

            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 20 }}>
                <Text>Chưa có tài khoản? </Text>
                <TouchableOpacity onPress={() => nav.navigate("register")}>
                    <Text style={{ color: '#0ea5e9', fontWeight: 'bold' }}>Đăng ký ngay</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

export default Login;
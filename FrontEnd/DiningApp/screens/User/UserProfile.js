import { Image, Text, View, ScrollView } from "react-native";
import UserStyle from "./UserStyle";
import { useContext } from "react";
import { MyUserContext } from "../../configs/MyContext";
import { Button } from "react-native-paper";

const ROLE_LABEL = {
    CUSTOMER: { label: "Khách hàng", color: "#0ea5e9", bg: "#e0f2fe" },
    CHEF:     { label: "Đầu bếp",   color: "#f59e0b", bg: "#fef3c7" },
    ADMIN:    { label: "Quản trị",  color: "#8b5cf6", bg: "#ede9fe" },
};

const InfoRow = ({ label, value, valueColor }) => (
    <View style={UserStyle.row}>
        <Text style={UserStyle.rowLabel}>{label}</Text>
        <Text style={[UserStyle.rowValue, valueColor && { color: valueColor, fontWeight: "700" }]}>
            {value}
        </Text>
    </View>
);

const Divider = () => <View style={UserStyle.divider} />;

const UserProfile = () => {
    const [user, dispatch] = useContext(MyUserContext);

    if (!user) return null;

    const role = ROLE_LABEL[user.role] ?? ROLE_LABEL.GUEST;

    return (
        <ScrollView contentContainerStyle={UserStyle.container}>
            <View style={UserStyle.card}>
                <View style={UserStyle.bannerStripe} />
                <View style={UserStyle.avatarWrapper}>
                    <Image
                        source={{ uri: user.avatar || "https://i.pravatar.cc/300" }}
                        style={UserStyle.avatar}
                    />
                </View>
                <Text style={UserStyle.name}>{user.first_name} {user.last_name}</Text>
                <View style={[UserStyle.roleBadge, { backgroundColor: role.bg }]}>
                    <Text style={[UserStyle.roleText, { color: role.color }]}>{role.label}</Text>
                </View>
            </View>

            <View style={UserStyle.infoCard}>
                <InfoRow label="Họ và tên" value={`${user.first_name} ${user.last_name}`} />
                <Divider />
                <InfoRow label="Tên đăng nhập" value={user.username} />
                <Divider />
                <InfoRow label="Email" value={user.email || "Chưa cập nhật"} />
                <Divider />
            </View>

            <Button mode="contained" onPress={() => dispatch({ type: "logout" })} buttonColor="#ef4444" icon="logout">
                Đăng xuất
            </Button>
        </ScrollView>
    );
};

export default UserProfile;
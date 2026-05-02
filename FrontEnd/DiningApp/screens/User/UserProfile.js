import { useContext } from "react";
import { Button } from "react-native-paper";
import { MyUserContext } from "../../configs/MyContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Styles from "../../styles/Styles";
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  Alert,
  FlatList,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import UserStyle from "./UserStyle";
import { authApis, endpoints } from "../../configs/Apis";
import { ActivityIndicator } from "react-native";
import { set } from "ramda";

const UserProfile = () => {
  const [user, dispatch] = useContext(MyUserContext);
  const [payments, setPayments] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const logout = async () => {
    await AsyncStorage.removeItem("token");
    AsyncStorage.clear();
    dispatch({
      type: "logout",
    });
  };

  const loadPayments = async () => {
    try {
      setLoading(true);
      let token = await AsyncStorage.getItem("token");
      let res = await authApis(token).get(endpoints["user-payments"]);
      setPayments(res.data);
      setShowPaymentModal(true);
    } catch (ex) {
      console.error(ex);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={UserStyle.container}>
      <View style={UserStyle.profileCard}>
        <View style={UserStyle.avatarContainer}>
          <Image
            source={{ uri: user.avatar || "https://i.pravatar.cc/300" }}
            style={UserStyle.avatar}
          />
        </View>
        <Text style={UserStyle.userName}>
          WELCOME! {user.first_name} {user.last_name}
        </Text>
        <Text style={UserStyle.userEmail}>{user.email || "Chưa có email"}</Text>
        <Text style={UserStyle.userEmail}>
          Số điện thoại liên hệ: {user.phone || "Chưa có SĐT"}
        </Text>
        <View style={{ width: "100%", gap: 12 }}>
          {user?.role === "STUDENT" && (
            <TouchableOpacity style={UserStyle.menuButton} onPress={loadPayments}>
              <Ionicons name="receipt-outline" size={24} color="#3b82f6" />
              <Text style={UserStyle.menuButtonText}>Lịch sử thanh toán</Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color="#9ca3af"
                style={{ marginLeft: "auto" }}
              />
            </TouchableOpacity>
          )}

          <TouchableOpacity style={UserStyle.logoutButton} onPress={logout}>
            <Ionicons name="log-out-outline" size={24} color="#e11d48" />
            <Text style={UserStyle.logoutButtonText}>Đăng xuất</Text>
          </TouchableOpacity>
        </View>
      </View>
      <Modal
        animationType="slide"
        transparent={true}
        visible={showPaymentModal}
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={UserStyle.modalOverlay}>
          <View style={UserStyle.modalContent}>
            <View style={UserStyle.modalHeader}>
              <Text style={UserStyle.modalTitle}>Hóa đơn của tôi</Text>
              <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
                <Ionicons name="close-circle" size={28} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {loading ? (
              <ActivityIndicator
                size="large"
                color="#3b82f6"
                style={{ marginTop: 20 }}
              />
            ) : (
              <FlatList
                data={payments}
                keyExtractor={(item) => item.id.toString()}
                ListEmptyComponent={
                  <Text
                    style={{ textAlign: "center", marginTop: 20, color: "#999" }}
                  >
                    Bạn chưa có giao dịch nào
                  </Text>
                }
                renderItem={({ item }) => (
                  <View style={UserStyle.paymentItem}>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={UserStyle.paymentCourse}
                      >{`Khóa học ${item.enrollment.course.subject}`}</Text>
                      <Text style={UserStyle.paymentDate}>
                        {new Date(item.created_date).toLocaleDateString(
                          "vi-VN"
                        )}
                      </Text>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={UserStyle.paymentAmount}>
                        {parseInt(item.amount).toLocaleString("vi-VN")} VNĐ
                      </Text>
                      <Text
                        style={{
                          color: "#F59E0B",
                          fontSize: 12,
                          fontWeight: "700",
                        }}
                      >
                        {item.status}
                      </Text>
                    </View>
                  </View>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default UserProfile;
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authApis, endpoints } from "./Apis";

const getApi = async () => {
  const token = await AsyncStorage.getItem("token");
  return authApis(token);
};

export const getOrCreateRoom = async (params) => {
  const api = await getApi();
  const res = await api.post(endpoints.chat_room, params);
  return res.data;
};

export const sendMessage = async (room_id, text) => {
  const api = await getApi();
  const res = await api.post(endpoints.chat_send, { room_id, text });
  return res.data;
};
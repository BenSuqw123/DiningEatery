import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

export const endpoints = {
    dishes:    "/dishes/",
    tables:    "/tables/",
    booked_times: (id) => `/tables/${id}/booked-times/`,
    invoices:  "/invoices/",
    categories: "/categories/",
    chefs:     "/chefs/",
    ingredients: "/ingredients/",
    bookCheckin: (id) => `/tables/${id}/bookedTimes/`,
    checkin:   (id) => `/tables/${id}/checkin/`,
    order:     (id) => `/tables/${id}/order/`,
    checkout:  (id) => `/tables/${id}/checkout/`,
    cancel:    (id) => `/tables/${id}/cancel-checkin/`,
    rates:     (id) => `/dishes/${id}/rates/`,
    login:     "/o/token/",
    register:  "/users/",
    current_user: "/users/current-user/",
    compare_dishes: (ids) => `/dishes/compare/?ids=${ids}`,


    //CHAT REALTIME
    chat_room:    "/chats/room/",
    chat_send:    "/chats/send/",
    chat_history: "/chats/history/",
    chat_room_chef: "/chats/room-chef/",

    //ADMIN
    'pending-chefs': '/chefs/pending/',
    'approve-chef': (id) => `/chefs/${id}/approve/`,
}

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;
const CLIENT_ID = process.env.EXPO_PUBLIC_CLIENT_ID;
const CLIENT_SECRET = process.env.EXPO_PUBLIC_CLIENT_SECRET;

export const authApis = (token) => {
  const instance = axios.create({
    baseURL: BASE_URL,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      if (error.response && error.response.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        const newToken = await refreshAccessToken();

        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return instance(originalRequest);
        }
      }

      return Promise.reject(error);
    }
  );

  return instance;
};

export default axios.create({
  baseURL: BASE_URL,
});
export const refreshAccessToken = async () => {
  try {
    const refreshToken = await AsyncStorage.getItem("refresh_token");

    if (!refreshToken) {
      return null;
    }

    const res = await axios.post(
      `${BASE_URL}${endpoints["login"]}`,
      `grant_type=refresh_token&refresh_token=${refreshToken}&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}`,
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );

    const newAccessToken = res.data.access_token;
    const newRefreshToken = res.data.refresh_token;

    await AsyncStorage.setItem("token", newAccessToken);
    if (newRefreshToken) {
      await AsyncStorage.setItem("refresh_token", newRefreshToken);
    }

    return newAccessToken;
  } catch (error) {
    console.log("Lỗi refresh token:", error);
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("refresh_token");
    return null;
  }
};


export { CLIENT_ID, CLIENT_SECRET };


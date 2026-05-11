import React, { useEffect, useState, useRef, useContext } from "react";
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator
} from "react-native";
import { getDatabase, ref, query, orderByChild, limitToLast, onChildAdded, off } from "firebase/database";
import app from "../../configs/firebase";
import { getOrCreateRoom, sendMessage } from "../../configs/Chat";
import { MyUserContext } from "../../configs/MyContext";

const ChatScreen = ({ route }) => {
  const { chef_id, chef_name, room_id: existingRoomId, other_name } = route.params;
  const [user]          = useContext(MyUserContext);
  const current_user_id = user?.id;

  // Tên hiển thị: customer thấy chef_name, chef thấy other_name
  const displayName = chef_name || other_name || "Chat";

  const [messages, setMessages] = useState([]);
  const [text, setText]         = useState("");
  const [roomId, setRoomId]     = useState(null);
  const [sending, setSending]   = useState(false);
  const listRef                 = useRef();

  useEffect(() => {
    if (existingRoomId) {
      // Chef vào room có sẵn
      setRoomId(existingRoomId);
    } else {
      // Customer tạo room mới
      getOrCreateRoom({ chef_id })
        .then(data => setRoomId(data.room_id))
        .catch(err => console.error("Lỗi tạo room:", err));
    }
  }, []);

  useEffect(() => {
    if (!roomId) return;

    const db     = getDatabase(app, process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL);
    const msgRef = query(
        ref(db, `chats/${roomId}/messages`),
        orderByChild("timestamp"),
        limitToLast(50)
    );

    const handler = onChildAdded(msgRef, snap => {
        const msg = { id: snap.key, ...snap.val() };
        setMessages(prev =>
            prev.find(m => m.id === msg.id) ? prev : [...prev, msg]
        );
    });

    return () => off(msgRef, "child_added", handler);
}, [roomId]);

  const handleSend = async () => {
    if (!text.trim() || !roomId || sending) return;
    const toSend = text.trim();
    setText("");
    setSending(true);
    try { await sendMessage(roomId, toSend); }
    catch (e) { console.error(e); }
    finally { setSending(false); }
  };

  const fmt = ts => ts
    ? new Date(ts).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#f5f5f5" }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={90}
    >
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10,
                     backgroundColor: "#ff7043", padding: 14 }}>
        <View style={{ width: 36, height: 36, borderRadius: 18,
                       backgroundColor: "rgba(255,255,255,0.3)",
                       alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: "#fff", fontWeight: "600", fontSize: 15 }}>
            {displayName?.[0]}
          </Text>
        </View>
        <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
          {displayName}
        </Text>
      </View>

      {!roomId ? <ActivityIndicator style={{ flex: 1 }} /> :
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 12, gap: 4 }}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={
            <Text style={{ textAlign: "center", marginTop: 60, color: "#aaa" }}>
              Chưa có tin nhắn nào
            </Text>
          }
          renderItem={({ item }) => {
            const isMe = item.sender_id === current_user_id;
            return (
              <View style={{ flexDirection: "row", justifyContent: isMe ? "flex-end" : "flex-start" }}>
                <View style={{
                  maxWidth: "75%", padding: 10, borderRadius: 14, marginVertical: 2,
                  backgroundColor: isMe ? "#ff7043" : "#fff",
                  borderBottomRightRadius: isMe ? 2 : 14,
                  borderBottomLeftRadius: isMe ? 14 : 2,
                  borderWidth: isMe ? 0 : 0.5, borderColor: "#eee"
                }}>
                  <Text style={{ fontSize: 15, color: isMe ? "#fff" : "#222" }}>
                    {item.text}
                  </Text>
                  <Text style={{
                    fontSize: 10, marginTop: 4, alignSelf: "flex-end",
                    color: isMe ? "rgba(255,255,255,0.7)" : "#aaa"
                  }}>
                    {fmt(item.timestamp)}
                  </Text>
                </View>
              </View>
            );
          }}
        />
      }

      {/* Input */}
      <View style={{ flexDirection: "row", padding: 8, backgroundColor: "#fff",
                     borderTopWidth: 0.5, borderTopColor: "#ddd",
                     alignItems: "flex-end", gap: 8 }}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Nhập tin nhắn..."
          multiline
          maxLength={500}
          style={{ flex: 1, backgroundColor: "#f0f0f0", borderRadius: 20,
                   paddingHorizontal: 14, paddingVertical: 8, fontSize: 15, maxHeight: 100 }}
        />
        <TouchableOpacity
          onPress={handleSend}
          disabled={!text.trim() || sending}
          style={{ backgroundColor: "#ff7043", borderRadius: 20,
                   paddingHorizontal: 18, paddingVertical: 10,
                   opacity: (!text.trim() || sending) ? 0.4 : 1 }}
        >
          <Text style={{ color: "#fff", fontWeight: "600", fontSize: 14 }}>
            {sending ? "..." : "Gửi"}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

export default ChatScreen;
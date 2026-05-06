import { StyleSheet, Dimensions } from "react-native";

export default StyleSheet.create({
  container: {
        padding: 20,
        backgroundColor: "#f8fafc",
        flexGrow: 1,
    },
    card: {
        backgroundColor: "#fff",
        borderRadius: 24,
        alignItems: "center",
        paddingBottom: 24,
        marginBottom: 16,
        overflow: "hidden",
        elevation: 4,
    },
    bannerStripe: {
        width: "100%",
        height: 80,
        backgroundColor: "#0ea5e9",
        marginBottom: -40,
    },
    avatarWrapper: {
        borderRadius: 60,
        borderWidth: 4,
        borderColor: "#fff",
        elevation: 6,
        marginBottom: 12,
    },
    avatar: {
        width: 90,
        height: 90,
        borderRadius: 45,
    },
    name: {
        fontSize: 22,
        fontWeight: "800",
        color: "#0f172a",
        letterSpacing: 0.3,
    },
    username: {
        fontSize: 14,
        color: "#94a3b8",
        marginTop: 2,
        marginBottom: 10,
    },
    roleBadge: {
        paddingHorizontal: 16,
        paddingVertical: 5,
        borderRadius: 20,
    },
    roleText: {
        fontSize: 13,
        fontWeight: "700",
        letterSpacing: 0.5,
    },
    infoCard: {
        backgroundColor: "#fff",
        borderRadius: 20,
        paddingHorizontal: 20,
        paddingVertical: 8,
        marginBottom: 20,
        elevation: 3,
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 14,
    },
    rowLabel: {
        fontSize: 14,
        color: "#94a3b8",
        fontWeight: "500",
    },
    rowValue: {
        fontSize: 14,
        color: "#1e293b",
        fontWeight: "600",
        maxWidth: "60%",
        textAlign: "right",
    },
    divider: {
        height: 1,
        backgroundColor: "#f1f5f9",
    },
});
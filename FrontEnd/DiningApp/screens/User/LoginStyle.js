import { StyleSheet } from "react-native";

export default StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f8fafc",
    },
    scrollContent: {
        flexGrow: 1,
    },
    banner: {
        backgroundColor: "#0ea5e9",
        paddingTop: 60,
        paddingBottom: 50,
        alignItems: "center",
        overflow: "hidden",
        position: "relative",
    },
    bannerCircle1: {
        position: "absolute",
        width: 180,
        height: 180,
        borderRadius: 90,
        backgroundColor: "rgba(255,255,255,0.1)",
        top: -40,
        left: -40,
    },
    bannerCircle2: {
        position: "absolute",
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: "rgba(255,255,255,0.08)",
        bottom: -20,
        right: -20,
    },
    bannerIcon: {
        fontSize: 52,
        marginBottom: 12,
    },
    title: {
        fontSize: 26,
        fontWeight: "800",
        color: "#fff",
        marginBottom: 6,
    },
    subtitle: {
        fontSize: 14,
        color: "rgba(255,255,255,0.85)",
    },
    content: {
        paddingHorizontal: 24,
        paddingTop: 32,
        paddingBottom: 32,
    },
    input: {
        backgroundColor: "#fff",
        marginBottom: 16,
    },
    loginButton: {
        borderRadius: 14,
        marginTop: 8,
        marginBottom: 24,
        elevation: 4,
    },
    loginButtonText: {
        fontSize: 16,
        fontWeight: "700",
        letterSpacing: 0.5,
    },
    signupContainer: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
    },
    signupText: {
        fontSize: 14,
        color: "#6b7280",
    },
    signupLink: {
        fontSize: 14,
        color: "#0ea5e9",
        fontWeight: "700",
    },
});
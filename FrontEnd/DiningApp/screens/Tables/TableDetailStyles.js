import { StyleSheet } from "react-native";

const Styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: "#f7f5f2", padding: 16, paddingTop: 50 },
    pageTitle: { fontSize: 22, fontWeight: "700", marginBottom: 12 },
    card: { backgroundColor: "#fff", borderRadius: 10, padding: 14, marginBottom: 12 },
    cardTitle: { fontSize: 16, fontWeight: "700", marginBottom: 8 },
    emptyText: { color: "#888" },
    errorText: { color: "red", marginBottom: 8 },

    // countdown
    countdown: { alignItems: "center", backgroundColor: "#E3F2FD", borderRadius: 8, padding: 10, marginBottom: 10 },
    cdLabel: { color: "#1565C0", fontSize: 12 },
    cdTime: { color: "#1565C0", fontSize: 32, fontWeight: "700" },
    cdTimeUrgent: { color: "red" },

    // invoice
    invoiceBox: { backgroundColor: "#fff8e1", borderRadius: 8, padding: 10, marginBottom: 8 },
    invoiceTitle: { fontWeight: "700", marginBottom: 4 },
    invoiceTotal: { fontWeight: "700", marginTop: 4 },

    // modal
    modalContainer: { flex: 1, backgroundColor: "#f7f5f2" },
    modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, paddingTop: 50, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#eee" },
    modalTitle: { fontSize: 18, fontWeight: "700" },
    modalList: { padding: 12, paddingBottom: 120 },
    modalFooter: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 16, paddingBottom: 32, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#eee", alignItems: "center" },
    modalCartText: { marginBottom: 6, fontWeight: "600" },

    // dish item
    dishItem: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 10, padding: 12, marginBottom: 10 },
    dishImage: { width: 60, height: 60, borderRadius: 8, marginRight: 12 },
    dishInfo: { flex: 1 },
    dishName: { fontWeight: "700" },
    dishPrice: { color: "#555" },

    // stepper
    stepper: { flexDirection: "row", alignItems: "center", gap: 8 },
    stepBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: "#eee", alignItems: "center", justifyContent: "center" },
    stepBtnTxt: { fontSize: 18 },
    stepQty: { minWidth: 20, textAlign: "center" },
});

export default Styles;
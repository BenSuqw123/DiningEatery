import { StyleSheet } from "react-native";

export default StyleSheet.create({
    container: {
        flex: 1,
        marginTop: 50
    }, row: {
        flexDirection: "row",
        flexWrap: "wrap", 
        flex: 1, 
    }, wrap: {
        flexWrap: "wrap"
    }, padding: {
        padding: 5
    }, margin: {
        margin: 5
    }, subject: {
        fontSize: 30,
        fontWeight: "bold",
        color: "blue"
    }, avatar: {
        width: 80,
        height: 80,
        borderRadius: 50
    }
});
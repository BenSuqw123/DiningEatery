import { useState } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import { Icon } from "react-native-paper";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Home from "./screens/Home/Home";
import Login from "./screens/User/Login";
import Register from "./screens/User/Register";
import Header from "./components/Header";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const StackNavigator = () => {
    const [cateId, setCateId] = useState();

    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index">
                {() => (
                    <>
                        <Header cateId={cateId} setCateId={setCateId} />
                        <Home cateId={cateId} />
                    </>
                )}
            </Stack.Screen>
        </Stack.Navigator>
    );
}

const TabNavigator = () => {
    return (
        <Tab.Navigator>
            <Tab.Screen name="home" component={StackNavigator}
                options={{ title: 'Món ăn', headerShown: false, tabBarIcon: () => <Icon source="home" size={30} /> }} />
            <Tab.Screen name="login" component={Login}
                options={{ title: 'Đăng nhập', tabBarIcon: () => <Icon source="account" size={30} /> }} />
            <Tab.Screen name="register" component={Register}
                options={{ title: 'Đăng ký', tabBarIcon: () => <Icon source="account-plus" size={30} /> }} />
        </Tab.Navigator>
    );
}

const App = () => {
    return (
        <NavigationContainer>
            <TabNavigator />
        </NavigationContainer>
    );
}

export default App;
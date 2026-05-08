import { useState, useContext, useReducer } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import { Icon } from "react-native-paper";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Home from "./screens/Home/Home";
import Login from "./screens/User/Login";
import Register from "./screens/User/Register";
import Header from "./components/Header";
import User from "./screens/User/User";
import Invoices from "./screens/Invoices/Invoices";
import Tables from "./screens/Tables/Tables";
import { MyUserContext, MyUserReducer } from "./configs/MyContext";
import UserProfile from "./screens/User/UserProfile";
import ManageDish from "./screens/Chef/ManageDish";
import { AlertProvider } from "./configs/AlertContext";
import { PaperProvider } from "react-native-paper";
import AdminStats from "./screens/Admin/AdminStats";

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

const AuthStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="UserMain" component={User} />
        <Stack.Screen name="login" component={Login} />
        <Stack.Screen name="register" component={Register} />
    </Stack.Navigator>
);

const TabNavigator = () => {
    const [user, ] = useContext(MyUserContext);
    return (
        <Tab.Navigator>
            

            {user?.role === 'CHEF' ? (
                <Tab.Screen name="manage" component={ManageDish}
                    options={{ title: 'Quản lý món', tabBarIcon: () => <Icon source="chef-hat" size={30} /> }} />

            ) : user?.role === 'ADMIN' ? (
                <Tab.Screen name="stats" component={AdminStats}
                    options={{ title: 'Thống kê', tabBarIcon: () => <Icon source="chart-bar" size={30} /> }} />

            ) : (
                <>
                    <Tab.Screen name="home" component={StackNavigator}
                        options={{ title: 'Món ăn', headerShown: false, tabBarIcon: () => <Icon source="silverware-fork-knife" size={30} /> }} />
                    <Tab.Screen name="tables" component={Tables}
                        options={{ title: 'Bàn', tabBarIcon: () => <Icon source="table-furniture" size={30} /> }} />
                    <Tab.Screen name="invoices" component={Invoices}
                        options={{ title: 'Hóa Đơn', tabBarIcon: () => <Icon source="receipt-text" size={30} /> }} />
                </>
            )}

            {user === null ? (
                <Tab.Screen name="user" component={AuthStack}
                    options={{ title: 'Tài Khoản', tabBarIcon: () => <Icon source="account" size={30} /> }} />
            ) : (
                <Tab.Screen name="profile" component={UserProfile}
                    options={{ title: 'Thông tin', tabBarIcon: () => <Icon source="account" size={30} /> }} />
            )}
        </Tab.Navigator>
    );
}

const App = () => {
    const [user, dispatch] = useReducer(MyUserReducer, null);
    return (
        <MyUserContext.Provider value={[user, dispatch]}>
            <PaperProvider>
                <AlertProvider>
                    <NavigationContainer>
                        <TabNavigator />
                    </NavigationContainer>
                </AlertProvider>
            </PaperProvider>
        </MyUserContext.Provider>
    );
}

export default App;
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
import { PaperProvider } from "react-native-paper";
import AdminStats from "./screens/Admin/AdminStats";
import ChatListScreen from "./screens/Chat/ChatListScreen";
import ChatScreen from "./screens/Chat/ChatScreen";
import TableDetailPage from "./screens/Tables/TableDetailPage";
import PaymentPage from "./screens/Tables/PaymentPage";
import CompareDish from "./screens/Home/CompareDish";
import DishDetail from "./screens/Home/DishDetail";
import ApprovalChef from "./screens/ApprovalChef.js/ApprovalChef";
import ChefStats from "./screens/ChefStats/ChefStats";
import CreateDish from "./screens/Chef/CreateDish";


const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const StackNavigator = () => {
    const [cateId, setCateId]     = useState();
    const [ordering, setOrdering] = useState("");
    const [filters, setFilters]   = useState({ chef_name: "", price: "", time_served: "", ingre_name: "" });

    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index">
                {() => (
                    <>
                        <Header cateId={cateId} setCateId={setCateId}
                            ordering={ordering} setOrdering={setOrdering}
                            filters={filters} setFilters={setFilters} />
                        <Home cateId={cateId} ordering={ordering} filters={filters} />
                    </>
                )}
            </Stack.Screen>
            <Stack.Screen name="CompareDish" component={CompareDish} />
            <Stack.Screen name="DishDetail" component={DishDetail} />
        </Stack.Navigator>
    );
};

const ChatStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="ChatList" component={ChatListScreen} />
        <Stack.Screen name="Chat" component={ChatScreen} />
    </Stack.Navigator>
);
const TableStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="TablesMain" component={Tables} />
        <Stack.Screen name="TableDetailPage" component={TableDetailPage} />
        <Stack.Screen name="PaymentPage" component={PaymentPage} />
    </Stack.Navigator>
);

const ChefStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="ManageDish" component={ManageDish} />
        <Stack.Screen name="CreateDish" component={CreateDish} />
    </Stack.Navigator>
);


const AuthStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="UserMain" component={User} />
        <Stack.Screen name="login" component={Login} />
        <Stack.Screen name="register" component={Register} />
    </Stack.Navigator>
);

const TabNavigator = () => {
    const [user,] = useContext(MyUserContext);
    return (
        <Tab.Navigator>


            {user?.role === 'CHEF' ? (
                <>
                    <Tab.Screen name="manage" component={ChefStack}
                        options={{ title: 'Quản lý món', tabBarIcon: () => <Icon source="chef-hat" size={30} /> }} />
                <Tab.Screen name="chef-stats" component={ChefStats}
                    options={{ title: 'Thống kê', tabBarIcon: () => <Icon source="chef-hat" size={30} /> }} />    
                    <Tab.Screen name="chat" component={ChatStack}
                        options={{ title: 'Chat', tabBarIcon: () => <Icon source="chat" size={30} /> }} />
                </>
            ) : user?.role === 'ADMIN' ? (
                <>
                    <Tab.Screen name="admin-stats" component={AdminStats}
                        options={{ title: 'Thống kê', tabBarIcon: () => <Icon source="chart-bar" size={30} /> }} />
                    <Tab.Screen name="approval-chef" component={ApprovalChef}
                        options={{ title: 'Duyệt đầu bếp', tabBarIcon: () => <Icon source="chef-hat" size={30} /> }} />
                </>
            ) : (
                <>
                    <Tab.Screen name="home" component={StackNavigator}
                        options={{ title: 'Món ăn', headerShown: false, tabBarIcon: () => <Icon source="silverware-fork-knife" size={30} /> }} />
                    <Tab.Screen name="tables" component={TableStack}
                        options={{ title: 'Bàn', tabBarIcon: () => <Icon source="table-furniture" size={30} /> }} />
                    <Tab.Screen name="invoices" component={Invoices}
                        options={{ title: 'Hóa Đơn', tabBarIcon: () => <Icon source="receipt-text" size={30} /> }} />

                    {user !== null && (
                        <Tab.Screen name="chat" component={ChatStack}
                            options={{ title: 'Chat', tabBarIcon: () => <Icon source="chat" size={30} /> }} />
                    )}
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
                <NavigationContainer>
                    <TabNavigator />
                </NavigationContainer>
            </PaperProvider>
        </MyUserContext.Provider>
    );
}

export default App;

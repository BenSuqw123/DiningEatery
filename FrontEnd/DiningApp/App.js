import { useState } from "react";
import Header from "./components/Header";
import Home from "./screens/Home/Home";
import { NavigationContainer } from "@react-navigation/native";

const App = () => {
  const [cateId, setCateId] = useState();

  return (
    <NavigationContainer>
    <Header/>
    <Home/>
    </NavigationContainer>
  );
}

export default App;
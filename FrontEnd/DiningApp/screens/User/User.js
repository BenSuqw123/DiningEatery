import { useContext } from "react";
import { MyUserContext } from "../../configs/MyContext";
import UserProfile from "./UserProfile";
import Login from "./Login";

const User = () => {
    const [user] = useContext(MyUserContext);

    return user ? <UserProfile /> : <Login />;
};

export default User;
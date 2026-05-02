import { createContext, useReducer } from "react";

export const MyUserContext = createContext();

const MyUserReducer = (current, action) => {
    switch (action.type) {
        case "login":  return action.payload;
        case "logout": return null;
    }
    return current;
};

export const MyUserProvider = ({ children }) => {
    const [user, dispatch] = useReducer(MyUserReducer, null);

    return (
        <MyUserContext.Provider value={[user, dispatch]}>
            {children}
        </MyUserContext.Provider>
    );
};
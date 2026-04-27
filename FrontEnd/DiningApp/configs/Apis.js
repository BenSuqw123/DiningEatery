import axios from "axios";

export const endpoints = {
    dishes : "/dishes/",
    chefs : "/chefs/",
    ingredients : "/ingredients/",
    categories : "/categories/",
    
}

export default axios.create({
    baseURL: "http://192.168.2.23:8000/"
})
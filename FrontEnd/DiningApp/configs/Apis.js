import axios from "axios";

export const endpoints = {
    dishes : "/dishes/",
    chefs : "/chefs/",
    ingredients : "/ingredients/",
    categories : "/categories/",
    
}

export default axios.create({
    baseURL: "http://192.168.1.17:8000/"
})

import axios from "axios";
import { BASE_URL } from "./constants";

const axiosInstance = axios.create({
    baseURL: BASE_URL, // prepended to URLs for all requests
    timeout: 10000, // 10000ms = 10s
    headers: {
        "Content-Type": "application/json", // specify json format
    },
});

axiosInstance.interceptors.request.use(
    (config) => {
        const accessToken = localStorage.getItem("token"); // localStorage uses data stored in browser
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`; // update request with token if present
        }
        return config;
    },
    (error) => {
        return Promise.reject(error); // ensure error is handled properly
    }
);

export default axiosInstance;
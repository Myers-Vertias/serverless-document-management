import axios from "axios";

// This is a placeholder for future AWS API Gateway URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://api.example.com/v1";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor to inject Cognito JWT Token in the future
api.interceptors.request.use(
  (config) => {
    const userJson = localStorage.getItem("sdms_current_user");
    if (userJson) {
      const user = JSON.parse(userJson);
      if (user && user.token) {
        config.headers.Authorization = `Bearer ${user.token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;

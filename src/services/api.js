import axios from "axios";
import { authService } from "./authService";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(async (config) => {
  if (!API_BASE_URL) throw new Error("errors.awsApiNotConfigured");
  const idToken = await authService.getIdToken();
  if (idToken) config.headers.Authorization = `Bearer ${idToken}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const serverMessage = error.response?.data?.message;
    if (status === 401) error.message = "errors.authSessionExpired";
    else if (status === 403) error.message = "errors.accessDenied";
    else if (serverMessage) error.message = serverMessage;
    else if (!error.response) error.message = "errors.apiNetworkError";
    return Promise.reject(error);
  }
);

export default api;

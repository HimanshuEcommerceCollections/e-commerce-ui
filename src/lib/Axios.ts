import axios, { AxiosResponse, AxiosError, InternalAxiosRequestConfig } from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("accessToken");
      // Admin pages have their own sign-in page.
      const inAdmin = window.location.pathname.startsWith("/admin");
      if (window.location.pathname !== "/admin/login") {
        window.location.replace(inAdmin ? "/admin/login" : "/login");
      }
    }
    return Promise.reject(error);
  }
);

export default api;
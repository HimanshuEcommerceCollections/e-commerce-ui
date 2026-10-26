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
    // Only a rejected session token signs the shopper out; a 401 on a call
    // made without one (a guest) is the page's to handle.
    // A 401 from a sign-in call is a wrong password, not an expired session.
    const authCall = error.config?.url?.startsWith("/api/auth/") ?? false;
    if (error.response?.status === 401 && error.config?.headers?.Authorization && !authCall) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("nexus-auth"); // the persisted session
      // Admin pages have their own sign-in page; the storefront one brings
      // the shopper back to where they were (?next=).
      const { pathname, search, hash } = window.location;
      if (pathname.startsWith("/admin")) {
        if (pathname !== "/admin/login") window.location.replace("/admin/login");
      } else if (pathname !== "/login") {
        window.location.replace(`/login?next=${encodeURIComponent(pathname + search + hash)}`);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
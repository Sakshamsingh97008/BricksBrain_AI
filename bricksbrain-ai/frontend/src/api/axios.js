import axios from "axios";

const api = axios.create({
  baseURL: "https://bricksbrain-backend-b8xz.onrender.com/api",
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("bb_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
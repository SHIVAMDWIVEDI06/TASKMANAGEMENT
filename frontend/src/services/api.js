import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:5000";
console.log("System Ready - Version 1.0.3");
console.log("Using API Base URL:", baseURL);

export const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

const STORAGE_KEY = "ttm_token";

export function getStoredToken() {
  return localStorage.getItem(STORAGE_KEY);
}

export function storeToken(token) {
  if (token) localStorage.setItem(STORAGE_KEY, token);
  else localStorage.removeItem(STORAGE_KEY);
}

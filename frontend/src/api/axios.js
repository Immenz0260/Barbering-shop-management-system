import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Runs before every outgoing request. If we have a saved token, attach it
// as an Authorization header automatically — so components never have to
// remember to do this themselves.
api.interceptors.request.use((config) => {                    
  const token = localStorage.getItem("token");                
  if (token) {                                                 
    config.headers.Authorization = `Bearer ${token}`;          
  }                                                             
  return config;                                                
});  

// If ANY request comes back 401 (expired/invalid token), the token is no
// longer trustworthy — clear it and send the person to log in again,
// instead of leaving pages stuck on a spinner with no explanation.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
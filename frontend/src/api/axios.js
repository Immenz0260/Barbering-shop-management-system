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

export default api;
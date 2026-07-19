import axios from "axios";

const API = axios.create({
  // Ensure your .env has VITE_API_URL=https://smart-campus-complaint-portal-project.onrender.com
  baseURL: import.meta.env.VITE_API_URL, 
  withCredentials: true,
});

export default API;
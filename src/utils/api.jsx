// src/utils/api.jsx
import axios from 'axios'

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL, // now http://localhost:5000/api
})

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('authToken')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

export default api
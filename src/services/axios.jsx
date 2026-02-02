import axios from 'axios';

const DataService = axios.create({
  baseURL: import.meta.env.VITE_API_URL + '/api/', 
  timeout: 30000, // 30 seconds for file uploads
  headers: {
    'Accept': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
});

// Request Interceptor
DataService.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // FormData ke liye Content-Type mat set karo
    // Browser automatically set kar dega with boundary
    if (!(config.data instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json';
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor
DataService.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response &&
      (error.response.status === 401 || error.response.status === 403)
    ) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default DataService;
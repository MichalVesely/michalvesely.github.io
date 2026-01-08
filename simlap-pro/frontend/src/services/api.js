import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

class ApiService {
  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Add auth token to requests
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Handle auth errors
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth
  async register(email, password) {
    const response = await this.client.post('/auth/register', { email, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  }

  async login(email, password) {
    const response = await this.client.post('/auth/login', { email, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  }

  async getMe() {
    const response = await this.client.get('/auth/me');
    localStorage.setItem('user', JSON.stringify(response.data));
    return response.data;
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  isAuthenticated() {
    return !!localStorage.getItem('token');
  }

  getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  // Telemetry Analysis
  async uploadTelemetry(file, simType, trackName, carName) {
    const formData = new FormData();
    formData.append('telemetry', file);
    formData.append('simType', simType);
    formData.append('trackName', trackName);
    formData.append('carName', carName);

    const response = await this.client.post('/analyze/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    return response.data;
  }

  async createDemoAnalysis(trackName, carName) {
    const response = await this.client.post('/analyze/demo', { trackName, carName });
    return response.data;
  }

  async getAnalysisHistory(limit = 10) {
    const response = await this.client.get(`/analyze/history?limit=${limit}`);
    return response.data;
  }

  async getAnalysis(id) {
    const response = await this.client.get(`/analyze/${id}`);
    return response.data;
  }

  async getUsage() {
    const response = await this.client.get('/usage');
    return response.data;
  }

  async getStats() {
    const response = await this.client.get('/stats');
    return response.data;
  }

  // Payments
  async createCheckoutSession(returnUrl) {
    const response = await this.client.post('/payment/create-checkout', { returnUrl });
    return response.data;
  }

  async createPortalSession(returnUrl) {
    const response = await this.client.post('/payment/create-portal', { returnUrl });
    return response.data;
  }
}

export default new ApiService();

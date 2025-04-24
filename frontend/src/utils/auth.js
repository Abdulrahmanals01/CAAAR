// Token management utilities
const TOKEN_KEY = 'token';
const ROLE_KEY = 'userRole';
const NAME_KEY = 'userName';
const ID_KEY = 'userId';

// Set token with expiry check
export const setToken = (token) => {
  if (!token) return false;
  localStorage.setItem(TOKEN_KEY, token);
  
  // Update axios headers
  if (typeof window !== 'undefined') {
    if (window.axios && window.axios.defaults) {
      window.axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }
  
  return true;
};

// Get token if not expired
export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

// Clear token and user data
export const clearAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
  localStorage.removeItem(NAME_KEY);
  localStorage.removeItem(ID_KEY);
  
  // Clear axios headers
  if (typeof window !== 'undefined') {
    if (window.axios && window.axios.defaults && window.axios.defaults.headers) {
      delete window.axios.defaults.headers.common['Authorization'];
    }
  }
};

// Set user data
export const setUserData = (user) => {
  if (!user) return;
  
  if (user.role) localStorage.setItem(ROLE_KEY, user.role);
  if (user.name) localStorage.setItem(NAME_KEY, user.name);
  if (user.id) localStorage.setItem(ID_KEY, user.id.toString());
};

// Get user data
export const getUserData = () => {
  return {
    role: localStorage.getItem(ROLE_KEY),
    name: localStorage.getItem(NAME_KEY),
    id: localStorage.getItem(ID_KEY)
  };
};

// Initialize auth headers
export const initAuthHeaders = () => {
  const token = getToken();
  if (token && typeof window !== 'undefined' && window.axios) {
    window.axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
};

export default {
  setToken,
  getToken,
  clearAuth,
  setUserData,
  getUserData,
  initAuthHeaders
};

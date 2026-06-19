import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

axios.defaults.withCredentials = true;
axios.defaults.baseURL =
  import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000`;

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [persona, setPersona] = useState('OPERATIONS_HEAD'); // Default persona
  const [refreshInterval, setRefreshInterval] = useState(30); // in seconds
  const [notifications, setNotifications] = useState([]);

  // Check authentication on app load
  const verifySession = async () => {
    try {
      const res = await axios.get('/api/auth/me');
      if (res.data.success) {
        const loggedUser = res.data.data;
        setUser(loggedUser);
        
        // Match default persona to user role
        if (loggedUser.role === 'ADMIN') {
          setPersona('OPERATIONS_HEAD'); // Admin can view everything, default to Ops Head
        } else {
          setPersona(loggedUser.role);
        }
      }
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    verifySession();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      if (res.data.success) {
        const loggedUser = res.data.data;
        setUser(loggedUser);
        
        if (loggedUser.role === 'ADMIN') {
          setPersona('OPERATIONS_HEAD');
        } else {
          setPersona(loggedUser.role);
        }
        return { success: true };
      }
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed. Please check your credentials.' 
      };
    } finally {
      setLoading(false);
    }
  };

  const register = async (fullName, email, password, confirmPassword) => {
    try {
      const res = await axios.post('/api/auth/register', {
        fullName,
        email,
        password,
        confirmPassword,
      });
      return res.data;
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.response?.data?.errors?.[0]?.msg || 'Registration failed.',
      };
    }
  };

  const logout = async () => {
    try {
      await axios.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout request error:', error);
    } finally {
      setUser(null);
      setPersona('OPERATIONS_HEAD');
      // Clear cookies on client side
      document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    }
  };

  // Get allowed personas for the current user's role
  const getAllowedPersonas = () => {
    if (!user) return [];
    if (user.role === 'ADMIN') {
      return [
        { key: 'CEO', label: 'CEO' },
        { key: 'CMO', label: 'Chief Medical Officer' },
        { key: 'OPERATIONS_HEAD', label: 'Operations Head' },
      ];
    }
    if (user.role === 'CEO') return [{ key: 'CEO', label: 'CEO' }];
    if (user.role === 'CMO') return [{ key: 'CMO', label: 'Chief Medical Officer' }];
    if (user.role === 'OPERATIONS_HEAD') return [{ key: 'OPERATIONS_HEAD', label: 'Operations Head' }];
    return [];
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        persona,
        setPersona,
        refreshInterval,
        setRefreshInterval,
        login,
        register,
        logout,
        verifySession,
        getAllowedPersonas: getAllowedPersonas(),
        notifications,
        setNotifications,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;

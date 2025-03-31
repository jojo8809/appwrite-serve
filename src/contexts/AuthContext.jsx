import React, { createContext, useContext, useState, useEffect } from 'react';
import { getUserProfile, logoutUser } from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const checkUser = async () => {
      const storedUser = localStorage.getItem('userInfo');
      const token = localStorage.getItem('userToken');
      
      if (storedUser && token) {
        setUser(JSON.parse(storedUser));
        try {
          // Verify the token is still valid by fetching user profile
          const userProfile = await getUserProfile();
          setUser(userProfile);
        } catch (error) {
          console.error('Failed to validate token:', error);
          logout();
        }
      }
      
      setLoading(false);
    };
    
    checkUser();
  }, []);

  const logout = () => {
    logoutUser();
    setUser(null);
  };

  const value = {
    user,
    loading,
    setUser,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

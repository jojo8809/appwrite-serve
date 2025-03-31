// If you have an auth check component that uses Supabase, replace it with:

import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

const AuthCheck = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check for token instead of Supabase session
    const userToken = localStorage.getItem('userToken');
    const userInfo = localStorage.getItem('userInfo');
    
    if (userToken && userInfo) {
      setIsAuthenticated(true);
    }
    
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default AuthCheck;

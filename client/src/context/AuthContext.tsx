import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { auth } from '../services/api';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

type AuthAction =
  | { type: 'AUTH_LOADING' }
  | { type: 'AUTH_SUCCESS'; payload: User }
  | { type: 'AUTH_ERROR'; payload: string }
  | { type: 'AUTH_LOGOUT' };

interface AuthContextType {
  state: AuthState;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
}

const initialState: AuthState = {
  user: null,
  loading: true,
  error: null,
  isAuthenticated: false,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_LOADING':
      return { ...state, loading: true, error: null };
    case 'AUTH_SUCCESS':
      return { 
        ...state, 
        user: action.payload, 
        loading: false, 
        error: null,
        isAuthenticated: true 
      };
    case 'AUTH_ERROR':
      return { 
        ...state, 
        loading: false, 
        error: action.payload, 
        user: null,
        isAuthenticated: false 
      };
    case 'AUTH_LOGOUT':
      return { 
        ...state, 
        user: null, 
        loading: false, 
        error: null,
        isAuthenticated: false 
      };
    default:
      return state;
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        dispatch({ type: 'AUTH_LOGOUT' });
        return;
      }

      try {
        dispatch({ type: 'AUTH_LOADING' });
        const response = await auth.getMe();
        dispatch({ type: 'AUTH_SUCCESS', payload: response.data });
      } catch (error) {
        auth.removeToken();
        dispatch({ type: 'AUTH_ERROR', payload: 'Session expired. Please login again.' });
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      dispatch({ type: 'AUTH_LOADING' });
      const response = await auth.login({ email, password });
      const { token, id, name, email: userEmail } = response.data;
      auth.setToken(token);
      dispatch({ 
        type: 'AUTH_SUCCESS', 
        payload: { id, name, email: userEmail } 
      });
    } catch (error) {
      dispatch({ type: 'AUTH_ERROR', payload: 'Invalid email or password' });
      throw error;
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      dispatch({ type: 'AUTH_LOADING' });
      const response = await auth.register({ email, password, name });
      const { token, id, name: userName, email: userEmail } = response.data;
      auth.setToken(token);
      dispatch({ 
        type: 'AUTH_SUCCESS', 
        payload: { id, name: userName, email: userEmail } 
      });
    } catch (error) {
      dispatch({ type: 'AUTH_ERROR', payload: 'Registration failed. Please try again.' });
      throw error;
    }
  };

  const logout = () => {
    auth.removeToken();
    dispatch({ type: 'AUTH_LOGOUT' });
  };

  return (
    <AuthContext.Provider value={{ state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Export as a named function instead of a const to fix Fast Refresh
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 
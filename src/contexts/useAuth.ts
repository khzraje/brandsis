import { useContext } from 'react';
import AuthContext from './AuthContext';

type AuthContextType = {
  isAuthenticated: boolean;
  isInitializing: boolean;
  username: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx as AuthContextType;
};

export default useAuth;

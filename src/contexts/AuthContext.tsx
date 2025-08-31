import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type AuthContextType = {
  isAuthenticated: boolean;
  isInitializing: boolean;
  username: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'qist_auth_v1';

// pre-computed SHA-256 of "osman:1997"
const CREDENTIAL_HASH = '5ecf056f2937e93c214984ca94c0ce6e4419449300e7fb519581cbb5d2bbf1b5';

async function sha256Hex(input: string) {
  const enc = new TextEncoder();
  const data = enc.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.username) {
          setUsername(parsed.username);
          setIsAuthenticated(true);
        }
      }
    } catch (e) {
      // ignore parse errors
    }
  setIsInitializing(false);
  }, []);

  const login = async (user: string, pass: string) => {
    const hash = await sha256Hex(`${user}:${pass}`);
    if (hash === CREDENTIAL_HASH) {
      setUsername(user);
      setIsAuthenticated(true);
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ username: user, ts: Date.now() }));
  setIsInitializing(false);
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUsername(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isInitializing, username, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;

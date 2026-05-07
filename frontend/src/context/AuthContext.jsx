import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(() => {
    const saved = localStorage.getItem('plantopiaAuth');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (auth) {
      localStorage.setItem('plantopiaAuth', JSON.stringify(auth));
    } else {
      localStorage.removeItem('plantopiaAuth');
    }
  }, [auth]);

  const login = (data) => {
    setAuth({
      token: data.token,
      ...data.user,
    });
  };

  const logout = () => {
    setAuth(null);
  };

  return (
    <AuthContext.Provider value={{ auth, login, logout, isStaff: auth && ['seller', 'manager', 'delivery'].includes(auth.role) }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

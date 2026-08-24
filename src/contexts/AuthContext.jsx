import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

const SESSION_KEY = 'jymes_auth_session';

export function AuthProvider({ children }) {
  const [userRole, setUserRole] = useState(() => {
    // 세션 스토리지에서 로그인 상태 복원 (새로고침해도 workers 재조회 없음)
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const login = React.useCallback((role, workerName) => {
    const session = { role, workerName };
    setUserRole(session);
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch {
      // 무시
    }
  }, []);

  const logout = React.useCallback(() => {
    setUserRole(null);
    sessionStorage.removeItem(SESSION_KEY);
  }, []);

  return (
    <AuthContext.Provider value={{ userRole, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

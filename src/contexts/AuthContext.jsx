import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

const SESSION_KEY = 'jymes_auth_token_v2';
const SALT = 'jymes_mes_secure_salt_2026';

// 간단한 난독화 함수 (평문 JSON 변조 방지)
function encodeSession(session) {
  try {
    const str = JSON.stringify(session);
    return btoa(encodeURIComponent(str + '|' + SALT));
  } catch (_e) {
    return '';
  }
}

function decodeSession(token) {
  try {
    const decoded = decodeURIComponent(atob(token));
    if (decoded.endsWith('|' + SALT)) {
      const jsonStr = decoded.replace('|' + SALT, '');
      return JSON.parse(jsonStr);
    }
    return null;
  } catch (_e) {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [userRole, setUserRole] = useState(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      if (saved) {
        return decodeSession(saved);
      }
      // 마이그레이션: 기존 평문 세션 제거
      sessionStorage.removeItem('jymes_auth_session');
      return null;
    } catch {
      return null;
    }
  });

  const login = React.useCallback((role, workerName) => {
    const session = { role, workerName, loginAt: new Date().getTime() };
    setUserRole(session);
    try {
      sessionStorage.setItem(SESSION_KEY, encodeSession(session));
      // 구버전 키 삭제
      sessionStorage.removeItem('jymes_auth_session');
    } catch {
      // 무시
    }
  }, []);

  const logout = React.useCallback(() => {
    setUserRole(null);
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem('jymes_auth_session');
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

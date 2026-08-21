import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { fetchWorkers } from '../services/firestore';

export default function Login() {
  const { login } = useAuth();
  const { t, lang, setLang } = useI18n();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [role, setRole] = useState('worker');
  const [workerName, setWorkerName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const attemptAutoLogin = async () => {
      const id = searchParams.get('id');
      const pw = searchParams.get('pw');
      
      if (id && (pw === '0000' || pw === '1111')) {
        setIsLoading(true);
        try {
          const workers = await fetchWorkers();
          const matched = workers.find(w => w.id.toUpperCase() === id.toUpperCase() || w.name === id);
          if (matched) {
            login('worker', matched.name);
            navigate('/');
          } else {
            setError('QR 코드 로그인 실패: 등록되지 않은 사번/이름입니다.');
          }
        } catch (e) {
          setError('로그인 처리 중 오류가 발생했습니다.');
        } finally {
          setIsLoading(false);
        }
      }
    };
    attemptAutoLogin();
  }, [searchParams, login, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== '1111' && password !== '0000') {
      setError(t('toast_auth_failed') || '비밀번호가 올바르지 않습니다. (기본: 1111)');
      return;
    }

    if (role === 'worker') {
      const name = workerName.trim();
      if (!name) {
        setError('작업자 성함 또는 사번을 입력해주세요.');
        return;
      }
      
      setIsLoading(true);
      try {
        const workers = await fetchWorkers();
        const matched = workers.find(w => w.name === name || w.id.toUpperCase() === name.toUpperCase());
        
        if (!matched) {
          setError(`등록되지 않은 작업자/사번입니다.`);
          setIsLoading(false);
          return;
        }
        
        login('worker', matched.name);
        navigate('/');
      } catch (e) {
        setError('서버와 통신 중 오류가 발생했습니다.');
        setIsLoading(false);
        return;
      }
    } else {
      login('admin', '관리자');
      navigate('/');
    }
  };

  return (
    <div className="modal-backdrop active" style={{ display: 'flex' }}>
      <div className="modal-content" style={{ maxWidth: '440px', position: 'relative' }}>
        <div style={{ marginBottom: '16px', borderBottom: '2px solid var(--border-color)', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <h3 className="modal-title" style={{ margin: 0, fontSize: '17px', fontWeight: 800 }}>
              {t('modal_title')}
            </h3>
            <select 
              className="lang-select lang-select-sm"
              value={lang}
              onChange={(e) => setLang(e.target.value)}
            >
              <option value="ko">🇰🇷 {t('lang_ko') || '한국어'}</option>
              <option value="en">🇺🇸 {t('lang_en') || 'English'}</option>
              <option value="th">🇹🇭 {t('lang_th') || 'ภาษาไทย'}</option>
              <option value="tl">🇵🇭 {t('lang_tl') || 'Tagalog'}</option>
              <option value="vi">🇻🇳 {t('lang_vi') || 'Tiếng Việt'}</option>
            </select>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
            {t('modal_subtitle')}
          </p>
        </div>

        <div className="role-selection-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
          <div 
            className="role-card" 
            style={{ 
              padding: '12px', 
              textAlign: 'center', 
              border: role === 'worker' ? '2px solid var(--accent-cyan)' : '2px solid transparent', 
              background: role === 'worker' ? '#f0f9ff' : 'var(--bg-card)',
              cursor: 'pointer',
              borderRadius: '8px'
            }}
            onClick={() => setRole('worker')}
          >
            <div style={{ background: 'rgba(2, 132, 199, 0.15)', color: 'var(--accent-cyan)', width: '38px', height: '38px', margin: '0 auto 6px auto', fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>
              👷
            </div>
            <h4 style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 2px 0' }}>{t('mode_worker')}</h4>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{t('mode_worker_desc')}</span>
          </div>

          <div 
            className="role-card" 
            style={{ 
              padding: '12px', 
              textAlign: 'center', 
              border: role === 'admin' ? '2px solid var(--accent-purple)' : '2px solid transparent', 
              background: role === 'admin' ? '#f5f3ff' : 'var(--bg-card)',
              cursor: 'pointer',
              borderRadius: '8px'
            }}
            onClick={() => setRole('admin')}
          >
            <div style={{ background: 'rgba(124, 58, 237, 0.1)', color: 'var(--accent-purple)', width: '38px', height: '38px', margin: '0 auto 6px auto', fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>
              👨‍💼
            </div>
            <h4 style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 2px 0' }}>{t('mode_admin')}</h4>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{t('mode_admin_desc')}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          {error && <div style={{ color: 'red', fontSize: '12px', marginBottom: '10px' }}>{error}</div>}
          
          {role === 'worker' && (
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
                {t('label_worker_name')}
              </label>
              <input 
                type="text" 
                className="form-control" 
                placeholder={t('placeholder_worker_name')}
                value={workerName}
                onChange={(e) => setWorkerName(e.target.value)}
              />
            </div>
          )}

          <div style={{ marginBottom: '14px' }}>
            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
              {t('label_password')}
            </label>
            <input 
              type="password" 
              className="form-control" 
              placeholder={t('placeholder_password')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="btn primary-btn" style={{ width: '100%', padding: '10px', fontSize: '14px', background: 'var(--accent-blue)', color: 'white', borderRadius: '4px', border: 'none' }}>
            {t('btn_login')}
          </button>
        </form>
      </div>
    </div>
  );
}
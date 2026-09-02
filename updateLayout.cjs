const fs = require('fs');

let layout = fs.readFileSync('src/components/Layout.jsx', 'utf8');

if (!layout.includes('isMobilePreview')) {
  // Add state
  layout = layout.replace(
    /const \[time, setTime\] = useState\(new Date\(\)\);/,
    `const [time, setTime] = useState(new Date());\n  const [isMobilePreview, setIsMobilePreview] = useState(false);`
  );

  // Add useEffect
  layout = layout.replace(
    /useEffect\(\(\) => \{\n\s*const timer = setInterval/,
    `useEffect(() => {
    if (isMobilePreview) {
      document.body.classList.add('mobile-preview-mode');
    } else {
      document.body.classList.remove('mobile-preview-mode');
    }
    // Cleanup on unmount
    return () => document.body.classList.remove('mobile-preview-mode');
  }, [isMobilePreview]);

  useEffect(() => {
    const timer = setInterval`
  );

  // Update buttons
  const oldButtons = `<button 
            className="btn btn-secondary btn-sm" 
            style={{ width: '100%', fontSize: '11px', padding: '4px 8px', marginTop: '2px' }}
            onClick={logout}
          >
            {t('role_switch')}
          </button>`;
  
  const newButtons = `<div style={{ display: 'flex', gap: '4px', marginTop: '2px' }}>
            <button 
              className="btn btn-secondary btn-sm" 
              style={{ flex: 1, fontSize: '11px', padding: '4px 8px' }}
              onClick={logout}
            >
              {t('role_switch')}
            </button>
            {userRole?.role === 'admin' && (
              <button
                className="btn btn-primary btn-sm"
                style={{ flex: 1, fontSize: '11px', padding: '4px 8px', background: isMobilePreview ? 'var(--accent-emerald)' : 'var(--accent-blue)', color: 'white' }}
                onClick={() => setIsMobilePreview(!isMobilePreview)}
                title="PC 화면에서도 모바일 크기로 미리 봅니다"
              >
                {isMobilePreview ? '🖥️ PC 모드' : '📱 모바일 모드'}
              </button>
            )}
          </div>`;

  layout = layout.replace(oldButtons, newButtons);

  fs.writeFileSync('src/components/Layout.jsx', layout);
  console.log('Layout.jsx updated successfully.');
} else {
  console.log('Layout.jsx already updated.');
}

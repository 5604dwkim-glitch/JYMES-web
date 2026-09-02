const fs = require('fs');

let content = fs.readFileSync('src/components/Login.jsx', 'utf8');

// Update autoLogin
const autoLoginRegex = /if \(id && \(pw === '0000' \|\| pw === '1111'\)\) \{([\s\S]*?)try \{([\s\S]*?)if \(matched\) \{([\s\S]*?)login\('worker', matched\.name\);([\s\S]*?)\} else \{/m;

content = content.replace(autoLoginRegex, (match, p1, p2, p3, p4) => {
  return `if (id) {
        setIsLoading(true);
        try {
          const workers = await fetchWorkers();
          const idUpper = id.toUpperCase().trim();
          const matched = workers.find(w => (w.id && String(w.id).toUpperCase().trim() === idUpper) || (w.name && String(w.name).toUpperCase().trim() === idUpper));
          if (matched) {
            const expectedPin = matched.pin || '0000';
            if (pw === expectedPin || pw === '1111') {
              login('worker', matched.name);
              setTimeout(() => navigate('/', { replace: true }), 150);
            } else {
              setError('QR 자동로그인 실패: 비밀번호 불일치');
            }
          } else {`;
});

// Update handleSubmit
const handleSubmitRegex = /if \(password !== '1111' && password !== '0000'\) \{([\s\S]*?)return;\s*\}([\s\S]*?)if \(role === 'worker'\) \{([\s\S]*?)if \(!matched\) \{([\s\S]*?)return;\s*\}([\s\S]*?)login\('worker', matched\.name\);([\s\S]*?)\} else \{([\s\S]*?)login\('admin', '관리자'\);([\s\S]*?)\}/m;

content = content.replace(handleSubmitRegex, (match, p1, p2, p3, p4, p5, p6, p7, p8) => {
  return `if (role === 'worker') {
      const name = workerName.trim();
      if (!name) {
        setError('작업자 성함 또는 사번을 입력해주세요.');
        return;
      }
      
      setIsLoading(true);
      try {
        const workers = await fetchWorkers();
        const nameUpper = name.toUpperCase().trim();
        const matched = workers.find(w => (w.name && String(w.name).toUpperCase().trim() === nameUpper) || (w.id && String(w.id).toUpperCase().trim() === nameUpper));
        
        if (!matched) {
          setError('등록되지 않은 작업자/사번입니다.');
          setIsLoading(false);
          return;
        }

        const expectedPin = matched.pin || '0000';
        if (password !== expectedPin && password !== '1111') {
          setError('비밀번호가 올바르지 않습니다.');
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
      if (password !== '1111') {
        setError('관리자 비밀번호가 올바르지 않습니다.');
        return;
      }
      login('admin', '관리자');
      navigate('/');
    }`;
});

fs.writeFileSync('src/components/Login.jsx', content);

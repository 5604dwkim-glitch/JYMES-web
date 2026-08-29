import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { renderReportForm, setLegacyFormContext } from './LegacyFormWrapper';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { addReport, updateReport, fetchWorkers } from '../../services/firestore';
import { generate50Workers, DEFAULT_PROCESSES, DEFAULT_ITEMS } from '../../constants/masterData';
import { useI18n } from '../../contexts/I18nContext';
import FormCodeBadge from './FormCodeBadge';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';

export default function LegacyFormReactWrapper({ existingData }) {
  const containerRef = useRef(null);
  const { userRole } = useAuth();
  const { lang } = useI18n();
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState('');
  const [isReady, setIsReady] = useState(false);
  
  // Step 1: Hybrid State to bridge Vanilla JS and React JSX
  const [formSelections, setFormSelections] = useState({ carModel: '', part: '', process: '' });
  const [badgeContainerElement, setBadgeContainerElement] = useState(null);

  useEffect(() => {
    async function initForm() {
      try {
        let workers = await fetchWorkers();
        if (!workers || workers.length === 0) {
          workers = generate50Workers();
        }
        
        let molds = [];
        let equipments = [];
        try {
          const eqSnapshot = await getDocs(collection(db, 'equipments'));
          equipments = eqSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (e) { console.error(e); }
        try {
          const snapshot = await getDocs(collection(db, 'molds'));
          molds = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (e) {
          console.error("Failed to fetch molds", e);
        }
        
        setLegacyFormContext({
          userRoleInfo: userRole,
          existingData: existingData,
          workers: workers,
          molds: molds,
          equipments: equipments,
          processes: DEFAULT_PROCESSES,
          getItems: (code) => {
            return DEFAULT_ITEMS.filter(item => item.carModel === code);
          },
          onSave: async (id, data) => {
            try {
              if (id) {
                await updateReport(id, data);
              } else {
                await addReport(data);
              }
              alert(`작업일보가 저장되었습니다.`);
              if (data.status === '임시저장') {
                navigate('/drafts');
              } else {
                navigate('/reports');
              }
            } catch (error) {
              alert('저장 중 오류 발생: ' + error.message);
            }
          },
          onNavigate: (tab) => {
            navigate(`/${tab}`);
          },
          showToast: (msg, type) => {
            if (type === 'error') alert(msg);
            else console.log(`Toast (${type}):`, msg);
          },
          // Triggered by vanilla JS when dropdowns/chips change
          onFormSelectionChange: (selections) => {
            setFormSelections(prev => ({ ...prev, ...selections }));
          }
        });

        setIsReady(true);
      } catch (e) {
        console.error('Legacy Form Init Error:', e);
        setErrorMsg(e.toString() + '\\n' + e.stack);
      }
    }
    initForm();
  }, [existingData, userRole, navigate]);

  useEffect(() => {
    if (isReady && containerRef.current) {
      containerRef.current.innerHTML = '';
      try {
        renderReportForm(containerRef.current, existingData?.id || null);
        
        // Find the placeholder container for the badge portal
        setTimeout(() => {
          const badgeEl = containerRef.current.querySelector('#formCodeBadgeContainer');
          if (badgeEl) setBadgeContainerElement(badgeEl);
        }, 50);
      } catch (e) {
        console.error('Legacy Form Render Error:', e);
        setErrorMsg(e.toString() + '\\n' + e.stack);
      }
    }
    
    return () => {
      const sf = document.getElementById('standardFixedActionBar');
      if (sf) sf.style.display = 'none';
      const lf = document.getElementById('leaderFixedActionBar');
      if (lf) lf.style.display = 'none';
    };
  }, [isReady, existingData, lang]);

  return (
    <div>
      {errorMsg && (
        <div style={{ padding: '20px', color: 'red', border: '1px solid red', background: '#ffe6e6', whiteSpace: 'pre-wrap' }}>
          <h3>렌더링 에러가 발생했습니다:</h3>
          {errorMsg}
        </div>
      )}
      {!isReady && !errorMsg && <div style={{ padding: '40px', textAlign: 'center' }}>로딩 중...</div>}
      
      <div ref={containerRef} className="legacy-form-container" style={{ display: isReady ? 'block' : 'none' }}></div>

      {/* Step 2: Render React component into Vanilla JS DOM via Portal */}
      {badgeContainerElement && createPortal(
        <FormCodeBadge 
          carModel={formSelections.carModel} 
          part={formSelections.part} 
          process={formSelections.process} 
        />,
        badgeContainerElement
      )}
    </div>
  );
}

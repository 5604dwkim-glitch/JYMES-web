import React from 'react';
import { getCurrentFormCode } from '../../constants/formCodes';

const FormCodeBadge = ({ carModel, part, process }) => {
  if (!process) return null;
  const codeNum = getCurrentFormCode(carModel, part, process);

  return (
    <div style={{
      padding: '10px 14px',
      background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.08), rgba(99, 102, 241, 0.08))',
      border: '1.5px solid rgba(2, 132, 199, 0.3)',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '16px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--accent-blue)' }}>🏷️ 양식 고유번호:</span>
        <span style={{
          fontSize: '14px', fontWeight: 900, color: '#0284c7', background: '#ffffff',
          padding: '2px 10px', borderRadius: '6px', border: '1px solid #0284c7',
          fontFamily: 'monospace', letterSpacing: '0.5px'
        }}>#{codeNum}</span>
      </div>
      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
        ({carModel}{part ? ' - ' + part : ''}{process ? ' - ' + process : ''})
      </span>
    </div>
  );
};

export default FormCodeBadge;

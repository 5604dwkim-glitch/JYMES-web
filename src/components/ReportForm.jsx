import React from 'react';
import { useLocation } from 'react-router-dom';
import LegacyFormReactWrapper from './DynamicForms/LegacyFormReactWrapper';

export default function ReportForm() {
  const location = useLocation();
  const existingData = location.state?.existingData || null;
  const initialTpmSummary = location.state?.tpmCheckSummary || null;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '140px' }}>
      <LegacyFormReactWrapper existingData={existingData} initialTpmSummary={initialTpmSummary} />
    </div>
  );
}

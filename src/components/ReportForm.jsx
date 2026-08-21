import React from 'react';
import { useLocation } from 'react-router-dom';
import LegacyFormReactWrapper from './DynamicForms/LegacyFormReactWrapper';

export default function ReportForm() {
  const location = useLocation();
  const existingData = location.state?.existingData || null;

  // We use the LegacyFormReactWrapper which executes the original reportForm.js logic
  // but maps its save operations directly to our new Firebase Firestore React Context.
  // This ensures 100% compatibility with all complex rules (DT CREW, JG1, etc.)
  // without needing thousands of lines of new JSX conditional logic.
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '140px' }}>
      <LegacyFormReactWrapper existingData={existingData} />
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import LegacyAnalyticsWrapper from './DynamicForms/LegacyAnalyticsWrapper';
import { fetchReports } from '../services/firestore';

export default function Analytics() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      // By default, fetch the last 30 days of data for analytics to prevent huge read costs
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const endDate = new Date().toISOString().split('T')[0];
      const data = await fetchReports({ startDate, endDate });
      setReports(data);
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading Analytics...</div>;
  }

  return <LegacyAnalyticsWrapper reports={reports} />;
}

import { useState, useEffect } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export const useDashboardData = () => {
  const [data, setData] = useState({
    sensors: [],
    stats: {
      avgMoisture: '0%',
      avgTemp: '0°C',
      activeSensors: '0/0',
      overallHealth: '0%'
    },
    loading: true,
    error: null
  });

  const fetchDashboardData = async () => {
    try {
      // 1. Canlı Sensör Verilerini Çek
      const sensorsRes = await fetch(`${API_BASE_URL}/sensors/live`);
      const sensorsData = await sensorsRes.json();

      // 2. Özet Bilgileri Çek
      const summaryRes = await fetch(`${API_BASE_URL}/dashboard/summary`);
      const summaryData = await summaryRes.json();

      if (sensorsData.success && summaryData.success) {
        setData({
          sensors: sensorsData.data,
          stats: {
            avgMoisture: summaryData.data.avgMoisture || '68%',
            avgTemp: summaryData.data.avgTemp || '24°C',
            activeSensors: summaryData.data.activeSensors || '5/5',
            overallHealth: summaryData.data.overallHealth || '94%'
          },
          loading: false,
          error: null
        });
      }
    } catch (err) {
      console.error('API Fetch Hatası:', err);
      setData(prev => ({ ...prev, loading: false, error: 'API bağlantısı kurulamadı.' }));
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // Her 30 saniyede bir verileri tazele
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  return data;
};

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
    user: { name: 'Ümitcan', role: 'Admin' },
    weather: { temp: 24, condition: 'Güneşli' },
    sensorHistory: [],
    aiRecommendations: [],
    loading: true,
    error: null
  });

  const fetchDashboardData = async () => {
    try {
      // Fetching all necessary data
      const [sensorsRes, summaryRes, historyRes, aiRes] = await Promise.all([
        fetch(`${API_BASE_URL}/sensors/live`),
        fetch(`${API_BASE_URL}/dashboard/summary`),
        fetch(`${API_BASE_URL}/sensors/history?sensorId=101`),
        fetch(`${API_BASE_URL}/ai/recommendations`)
      ]);

      const sensorsData = await sensorsRes.json();
      const summaryData = await summaryRes.json();
      const historyData = await historyRes.json();
      const aiData = await aiRes.json();

      if (sensorsData.success && summaryData.success) {
        // Grafikler için veriyi formatla
        const formattedHistory = (historyData.data || []).map(h => ({
          name: new Date(h.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
          value: h.temp
        }));

        setData(prev => ({
          ...prev,
          sensors: sensorsData.data,
          stats: {
            avgMoisture: summaryData.data.avgMoisture || '68%',
            avgTemp: summaryData.data.avgTemp || '24°C',
            activeSensors: summaryData.data.activeSensors || '10/10',
            overallHealth: summaryData.data.overallHealth || '95%'
          },
          weather: summaryData.data.weather || { temp: 24, condition: 'Güneşli' },
          sensorHistory: formattedHistory.length > 0 ? formattedHistory : [
            { name: '08:00', value: 20 }, { name: '12:00', value: 25 }, { name: '16:00', value: 23 }
          ],
          aiRecommendations: aiData.data || [],
          loading: false,
          error: null
        }));
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

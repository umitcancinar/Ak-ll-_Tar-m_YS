import { useState, useEffect } from 'react';

const API_BASE_URL = 'https://ak-ll-tar-m-ys.vercel.app/api/v1';

export const useDashboardData = () => {
  const [data, setData] = useState({
    sensors: [],
    stats: [
      { id: 1, color: 'emerald', trend: '+0%', title: 'Sistem Sağlığı', value: '0%' },
      { id: 2, color: 'blue', trend: '0%', title: 'Ortalama Nem', value: '0%' },
      { id: 3, color: 'amber', trend: '0', title: 'Aktif Uyarılar', value: '0' }
    ],
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
          stats: [
            { id: 1, color: 'emerald', trend: '+1.2%', title: 'Sistem Sağlığı', value: summaryData.data.overallHealth || '95%' },
            { id: 2, color: 'blue', trend: '-0.5%', title: 'Ortalama Nem', value: summaryData.data.avgMoisture || '68%' },
            { id: 3, color: 'amber', trend: '+2', title: 'Aktif Uyarılar', value: summaryData.data.activeAlerts?.toString() || '0' }
          ],
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

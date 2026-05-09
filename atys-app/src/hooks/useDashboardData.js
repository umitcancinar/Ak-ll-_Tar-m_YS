import { useState, useEffect } from 'react';

export const useDashboardData = () => {
  const [data, setData] = useState({
    user: { name: 'Ümitcan' },
    weather: {
      temp: 24,
      condition: 'Güneşli',
      location: 'Konya, Karatay',
      humidity: '%42'
    },
    stats: [
      { id: 1, title: 'Genel Ürün Sağlığı', value: '%94', trend: '+2.1%', status: 'healthy', color: 'emerald' },
      { id: 2, title: 'Aktif Sulama', value: '4 Bölge', trend: 'Stabil', status: 'active', color: 'blue' },
      { id: 3, title: 'AI Uyarıları', value: '2 Kritik', trend: '-1', status: 'warning', color: 'amber' }
    ],
    sensorHistory: [
      { time: '00:00', nem: 65, sicaklik: 18, ph: 6.5, verimlilik: 82 },
      { time: '04:00', nem: 68, sicaklik: 16, ph: 6.4, verimlilik: 84 },
      { time: '08:00', nem: 62, sicaklik: 20, ph: 6.6, verimlilik: 85 },
      { time: '12:00', nem: 55, sicaklik: 25, ph: 6.5, verimlilik: 88 },
      { time: '16:00', nem: 58, sicaklik: 24, ph: 6.5, verimlilik: 90 },
      { time: '20:00', nem: 63, sicaklik: 21, ph: 6.7, verimlilik: 92 },
      { time: '23:59', nem: 66, sicaklik: 19, ph: 6.6, verimlilik: 94 },
    ],
    sensors: [
      { id: 'S1', x: 25, y: 35, status: 'good', label: 'Mısır Tarlası A-1', details: { moisture: '%65', temp: '22°C', health: '%98' } },
      { id: 'S2', x: 55, y: 30, status: 'good', label: 'Buğday Tarlası B-2', details: { moisture: '%62', temp: '23°C', health: '%95' } },
      { id: 'S3', x: 75, y: 45, status: 'warning', label: 'Mısır Tarlası A-2', details: { moisture: '%45', temp: '26°C', health: '%82' } },
      { id: 'S4', x: 40, y: 65, status: 'good', label: 'Patates Tarlası C-1', details: { moisture: '%70', temp: '21°C', health: '%96' } },
      { id: 'S5', x: 80, y: 70, status: 'offline', label: 'Boş Arazi D-1', details: { moisture: 'N/A', temp: 'N/A', health: 'N/A' } },
    ],
    aiRecommendations: [
      {
        id: 1,
        type: 'Sulama',
        title: 'Grok Analizi: Su Tasarrufu',
        description: 'Toprak nemi yeterli seviyede. Yarınki yağış ihtimali nedeniyle sulamayı 24 saat erteleyebilirsiniz.',
        priority: 'high',
        time: 'Şimdi'
      },
      {
        id: 2,
        type: 'Hasat',
        title: 'Optimum Hasat Zamanı',
        description: 'Bölge B-2 için veriler hasatın 3 gün içinde yapılmasının %12 daha fazla verim sağlayacağını gösteriyor.',
        priority: 'medium',
        time: '1 saat önce'
      }
    ],
    analytics: {
      weeklyGrowth: [
        { day: 'Pzt', growth: 12, water: 45 },
        { day: 'Sal', growth: 15, water: 40 },
        { day: 'Çar', growth: 18, water: 38 },
        { day: 'Per', growth: 22, water: 50 },
        { day: 'Cum', growth: 25, water: 55 },
        { day: 'Cmt', growth: 21, water: 30 },
        { day: 'Paz', growth: 28, water: 35 },
      ],
      cropDistribution: [
        { name: 'Mısır', value: 400 },
        { name: 'Buğday', value: 300 },
        { name: 'Patates', value: 200 },
        { name: 'Diğer', value: 100 },
      ]
    }
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setData(prev => ({
        ...prev,
        sensorHistory: prev.sensorHistory.map(h => ({
          ...h,
          nem: Math.max(0, h.nem + (Math.random() - 0.5) * 2),
        }))
      }));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return data;
};

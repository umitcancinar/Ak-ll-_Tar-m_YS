const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const cron = require('node-cron');
const fetch = require('node-fetch'); // Vercel için statik require
require('pg'); // Vercel bundler'ının pg sürücüsünü atlamaması için ZORUNLU
require('pg-hstore'); 
const sequelize = require('./config/database');
const { Sensor, History, Recommendation, Log } = require('./models/index');

dotenv.config();

const app = express();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, message: 'Hız sınırını aştınız.' }
});

app.use(limiter);
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// VERİTABANI BAĞLANTISI
// Not: Serverless ortamında (Vercel) her istekte sequelize.sync() çağırmak
// soğuk başlangıç (cold start) sürelerini uzatır ve zaman aşımına (Timeout) neden olarak
// FUNCTION_INVOCATION_FAILED (500) hatası fırlatır. Bu yüzden kaldırıldı.
// Veritabanı zaten yerel (local) ortamda çalıştırıldığında seed edildi.

// SERVERLESS DOSTU SİMÜLASYON FONKSİYONU
// Vercel'de arka planda cron çalışmadığı için, her istekte kontrol ederiz
const runSimulationUpdate = async () => {
  try {
    const lastSensor = await Sensor.findOne({ order: [['lastUpdate', 'DESC']] });
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    if (!lastSensor || lastSensor.lastUpdate < fiveMinutesAgo) {
      console.log('--- Serverless: Veriler Güncelleniyor ---');
      const sensors = await Sensor.findAll();
      for (const sensor of sensors) {
        const newTemp = parseFloat((Math.random() * (35 - 15) + 15).toFixed(1));
        const newMoisture = Math.floor(Math.random() * (80 - 30) + 30);
        const newPh = parseFloat((Math.random() * (7.5 - 5.5) + 5.5).toFixed(1));

        await sensor.update({ temp: newTemp, moisture: newMoisture, ph: newPh, lastUpdate: new Date() });
        await History.create({ sensorId: sensor.id, temp: newTemp, moisture: newMoisture, ph: newPh });
      }
    }
  } catch (err) {
    console.error('Simülasyon veya Veritabanı hatası:', err);
  }
};

// API V1 ROUTES
const router = express.Router();

router.get('/dashboard/summary', async (req, res) => {
  await runSimulationUpdate(); // Verileri tazele
  try {
    const sensors = await Sensor.findAll();
    res.json({
      success: true,
      data: {
        totalFields: 4,
        activeAlerts: sensors.filter(s => s.moisture < 40).length,
        overallHealth: '95%',
        weather: { temp: '24.2°C', status: 'Güneşli' }
      }
    });
  } catch (err) { res.status(500).json({ success: false }); }
});

router.get('/sensors/live', async (req, res) => {
  await runSimulationUpdate(); // Verileri tazele
  try {
    const sensors = await Sensor.findAll();
    res.json({ success: true, data: sensors });
  } catch (err) { res.status(500).json({ success: false }); }
});

router.get('/sensors/history', async (req, res) => {
  const { sensorId } = req.query;
  try {
    const history = await History.findAll({
      where: sensorId ? { sensorId } : {},
      limit: 20,
      order: [['timestamp', 'DESC']]
    });
    res.json({ success: true, data: history.reverse() });
  } catch (err) { res.status(500).json({ success: false }); }
});

router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Vercel API is alive' });
});

router.get('/ai/recommendations', async (req, res) => {
  try {
    // Statik sahte tavsiyeler (Gelecekte Grok'a bağlanabilir)
    const mockRecommendations = [
      { id: 1, type: 'sulama', title: 'Sulama Önerisi', message: 'Kuzey Mısır A-1 parselinde nem %40 altına düştü. 15 dakika sulama başlatın.' },
      { id: 2, type: 'gubre', title: 'Gübre Optimizasyonu', message: 'Güney Buğday B-1 parselinde pH 5.8 (düşük). Kireçleme yapılması önerilir.' },
      { id: 3, type: 'hasat', title: 'Hasat Tahmini', message: 'Doğu Mısır C-1 parselinde sıcaklık eğilimi hasat için uygun görünüyor.' }
    ];
    res.json({ success: true, data: mockRecommendations });
  } catch (err) { res.status(500).json({ success: false }); }
});

router.post('/ai/chat', async (req, res) => {
  const { messages } = req.body;
  try {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROK_API_KEY}`
      },
      body: JSON.stringify({ model: 'grok-2-1212', messages, stream: false })
    });
    const data = await response.json();
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false }); }
});

app.use('/api/v1', router);

// Sadece dosya doğrudan çalıştırıldığında (node server.js) portu dinle
// Vercel gibi serverless ortamlarda require('./server.js') yapıldığında app.listen ÇALIŞMAMALIDIR!
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[ATYS PostgreSQL] Server ${PORT} portunda çalışıyor...`);
  });
}

// Vercel Serverless Function için app'i dışa aktar
module.exports = app;

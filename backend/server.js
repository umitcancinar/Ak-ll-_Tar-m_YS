const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const cron = require('node-cron');
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

// VERİTABANI BAĞLANTISI VE TOHUMLAMA (SEEDING)
const initDB = async () => {
  try {
    await sequelize.sync({ force: false }); // force: true yaparsanız her seferinde tabloları silip yeniden oluşturur
    console.log('PostgreSQL bağlantısı başarılı.');

    // Eğer sensör yoksa başlangıç verilerini ekle (10 ADET SENSÖR)
    const sensorCount = await Sensor.count();
    if (sensorCount === 0) {
      await Sensor.bulkCreate([
        { label: 'Kuzey Mısır A-1', x: 15, y: 25, temp: 24, moisture: 65, ph: 6.2 },
        { label: 'Kuzey Mısır A-2', x: 35, y: 20, temp: 23, moisture: 68, ph: 6.4 },
        { label: 'Güney Buğday B-1', x: 48, y: 55, temp: 28, moisture: 45, ph: 5.8 },
        { label: 'Güney Buğday B-2', x: 65, y: 62, temp: 27, moisture: 42, ph: 5.9 },
        { label: 'Doğu Mısır C-1', x: 82, y: 35, temp: 22, moisture: 72, ph: 6.1 },
        { label: 'Batı Yonca D-1', x: 22, y: 75, temp: 25, moisture: 60, ph: 6.5 },
        { label: 'Merkez Sebze E-1', x: 50, y: 40, temp: 26, moisture: 55, ph: 6.3 },
        { label: 'Merkez Sebze E-2', x: 55, y: 48, temp: 25, moisture: 52, ph: 6.2 },
        { label: 'Kuzeybatı Arpa F-1', x: 12, y: 60, temp: 22, moisture: 58, ph: 6.0 },
        { label: 'Güneydoğu Mısır G-1', x: 88, y: 85, temp: 24, moisture: 70, ph: 6.6 }
      ]);
      console.log('10 Adet Pro Sensör Verisi Oluşturuldu.');
    }
  } catch (error) {
    console.error('Veritabanı hatası:', error);
  }
};

initDB();

// SERVERLESS DOSTU SİMÜLASYON FONKSİYONU
// Vercel'de arka planda cron çalışmadığı için, her istekte kontrol ederiz
const runSimulationUpdate = async () => {
  const lastSensor = await Sensor.findOne({ order: [['lastUpdate', 'DESC']] });
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

  if (!lastSensor || lastSensor.lastUpdate < fiveMinutesAgo) {
    console.log('--- Serverless: Veriler Güncelleniyor ---');
    try {
      const sensors = await Sensor.findAll();
      for (const sensor of sensors) {
        const newTemp = parseFloat((Math.random() * (35 - 15) + 15).toFixed(1));
        const newMoisture = Math.floor(Math.random() * (80 - 30) + 30);
        const newPh = parseFloat((Math.random() * (7.5 - 5.5) + 5.5).toFixed(1));

        await sensor.update({ temp: newTemp, moisture: newMoisture, ph: newPh, lastUpdate: new Date() });
        await History.create({ sensorId: sensor.id, temp: newTemp, moisture: newMoisture, ph: newPh });
      }
    } catch (err) { console.error('Simülasyon hatası:', err); }
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

router.post('/ai/chat', async (req, res) => {
  const { messages } = req.body;
  try {
    const fetch = (await import('node-fetch')).default;
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

app.listen(PORT, () => {
  console.log(`[ATYS PostgreSQL] Server ${PORT} portunda çalışıyor...`);
});

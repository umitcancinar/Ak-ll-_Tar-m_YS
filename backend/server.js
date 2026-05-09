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

    // Eğer sensör yoksa başlangıç verilerini ekle
    const sensorCount = await Sensor.count();
    if (sensorCount === 0) {
      await Sensor.bulkCreate([
        { label: 'Kuzey Parsel', x: 22, y: 35, temp: 24, moisture: 65, ph: 6.2 },
        { label: 'Güney Parsel', x: 48, y: 28, temp: 23, moisture: 68, ph: 6.4 },
        { label: 'Batı Sebze', x: 75, y: 45, temp: 28, moisture: 45, ph: 5.8 },
        { label: 'Doğu Mısır', x: 40, y: 70, temp: 22, moisture: 72, ph: 6.1 },
        { label: 'Merkez Yonca', x: 82, y: 82, temp: 25, moisture: 60, ph: 6.5 }
      ]);
      console.log('Başlangıç sensör verileri oluşturuldu.');
    }
  } catch (error) {
    console.error('Veritabanı hatası:', error);
  }
};

initDB();

// SİMUlasyon MOTORU: Her 1 dakikada bir PostgreSQL'e yeni veriler yaz
cron.schedule('*/1 * * * *', async () => {
  console.log('--- PostgreSQL Verileri Güncelleniyor ---');
  try {
    const sensors = await Sensor.findAll();
    for (const sensor of sensors) {
      const newTemp = parseFloat((Math.random() * (35 - 15) + 15).toFixed(1));
      const newMoisture = Math.floor(Math.random() * (80 - 30) + 30);
      const newPh = parseFloat((Math.random() * (7.5 - 5.5) + 5.5).toFixed(1));

      // 1. Sensörü güncelle
      await sensor.update({
        temp: newTemp,
        moisture: newMoisture,
        ph: newPh,
        lastUpdate: new Date()
      });

      // 2. Geçmiş tabloya (History) kayıt at (Grafikler için)
      await History.create({
        sensorId: sensor.id,
        temp: newTemp,
        moisture: newMoisture,
        ph: newPh
      });
    }
  } catch (error) {
    console.error('Simülasyon hatası:', error);
  }
});

// API V1 ROUTES
const router = express.Router();

router.get('/dashboard/summary', async (req, res) => {
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

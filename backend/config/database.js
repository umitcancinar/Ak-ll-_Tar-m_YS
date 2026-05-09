const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

// Railway'den gelen DATABASE_URL'i kullanır, yoksa yerel PostgreSQL'e bağlanır
const sequelize = new Sequelize(process.env.DATABASE_URL || 'postgres://postgres:password@localhost:5432/atys_db', {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: process.env.DATABASE_URL ? {
      require: true,
      rejectUnauthorized: false // Railway ve benzeri cloud DB'ler için gerekli
    } : false
  }
});

module.exports = sequelize;

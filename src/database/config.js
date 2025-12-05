require('dotenv').config();

const sqlConfig = {
    database: process.env.DB_NAME,
    host: process.env.DB_IP,
    port: parseInt(process.env.DB_PORT) || 5432,
    password: process.env.DB_PASSWORD || '',
    username: process.env.DB_USER,
    logging: process.env.DB_LOGGING === 'true',
    dialect: 'postgres',
    migrationStorageTableName: 'sequelize_meta',
};

module.exports = {
  development: sqlConfig,
  test: sqlConfig,
  production: sqlConfig
};
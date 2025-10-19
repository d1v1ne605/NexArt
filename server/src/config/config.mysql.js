"use strict";

const dev = {
  db: {
    host: process.env.DEV_DB_HOST || "localhost",
    port: process.env.DEV_DB_PORT || 3306,
    username: process.env.DEV_DB_USERNAME || "root",
    password: process.env.DEV_DB_PASSWORD || "",
    nameDb: process.env.DEV_DB_NAME,
  },
};

const product = {
  db: {
    host: process.env.PRO_DB_HOST,
    port: process.env.PRO_DB_PORT || 3306,
    username: process.env.PRO_DB_USERNAME,
    password: process.env.PRO_DB_PASSWORD,
    nameDb: process.env.PRO_DB_NAME,
  },
};

const config = { dev, product };
const env = process.env.NODE_ENV || "dev";

const exportConfig = config[env] && config[env].db ? config[env] : dev;

export default exportConfig;
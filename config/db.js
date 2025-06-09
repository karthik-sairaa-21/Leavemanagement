// const mysql = require('mysql2/promise');

// let connection;

// async function connectDB() {
//   if (!connection) {
//     connection = await mysql.createConnection({
//       host: process.env.DB_HOST,
//       user: process.env.DB_USER,
//       password: process.env.DB_PASS,
//       database: process.env.DB_NAME,
//       connectionLimit: process.env.DB_Limit
//     });
//     console.log(" Connected to MySQL");
//   }
// }

// function getDB() {
//   if (!connection) {
//     throw new Error(" DB not connected yet. Call connectDB first.");
//   }
//   return connection;
// }

// module.exports = { connectDB, getDB };

const mysql = require('mysql2/promise');
const { mysqlConfig } = require('./config');

let connection;

async function connectDB() {
  if (!connection) {
    connection = await mysql.createConnection({
      host: mysqlConfig.host,
      user: mysqlConfig.user,
      password: mysqlConfig.password,
      database: mysqlConfig.database,
    });
    console.log("✅ Connected to MySQL");
  }
}

function getDB() {
  if (!connection) {
    throw new Error("❌ DB not connected yet. Call connectDB first.");
  }
  return connection;
}

module.exports = { connectDB, getDB };

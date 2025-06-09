

const { Worker } = require('bullmq');
const Redis = require('ioredis');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const config = require('./confi');

const redisConnection = new Redis(config.redisConfig);
const pool = mysql.createPool(config.mysqlConfig);

const worker = new Worker(
  'userQueue',
  async (job) => {
    const user = job.data;
    const email = (user.email || user.Email || '').toLowerCase();

    const name = user.name || user.Name;
    const role = (user.role || user.Role || '').toUpperCase();
    const password = user.password || user.Password;
    const status = user.status || user.Status || 'ACTIVE';

    // Emails for manager, hr, director to map IDs later
    const managerEmail = (user.managerEmail || user.ManagerEmail || '').toLowerCase().trim();
    const hrEmail = (user.hrEmail || user.HrEmail || '').toLowerCase().trim();
    const directorEmail = (user.directorEmail || user.DirectorEmail || '').toLowerCase().trim();

    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      // Check if user already exists
      const [existing] = await conn.query('SELECT user_id FROM users WHERE email = ?', [email]);
      if (existing.length > 0) {
        console.log(`⏩ User already exists, skipping: ${email}`);
        await conn.commit();
        return;
      }

      const hashed = await bcrypt.hash(password, 10);

      // Insert user without foreign keys first
      const [result] = await conn.query(
        `INSERT INTO users (name, role, email, password, status) VALUES (?, ?, ?, ?, ?)`,
        [name, role, email, hashed, status]
      );
      const insertedId = result.insertId;

      // Helper to get user_id by email
      async function getUserIdByEmail(emailToFind) {
        if (!emailToFind) return null;
        const [rows] = await conn.query('SELECT user_id FROM users WHERE email = ?', [emailToFind]);
        return rows[0]?.user_id || null;
      }

      const manager_id = await getUserIdByEmail(managerEmail);
      const hr_id = await getUserIdByEmail(hrEmail);
      const director_id = await getUserIdByEmail(directorEmail);

      // Update user with manager, hr, director IDs
      await conn.query(
        `UPDATE users SET manager_id = ?, hr_id = ?, director_id = ? WHERE user_id = ?`,
        [manager_id, hr_id, director_id, insertedId]
      );

      await conn.commit();
      console.log(`✅ Inserted and updated user: ${email}`);

    } catch (err) {
      await conn.rollback();
      console.error(`❌ Error processing user: ${email}`, err);
    } finally {
      conn.release();
    }
  },
  {
    connection: redisConnection,
    limiter: { max: 1, duration: 500 }, // slow down to avoid overload
  }
);

worker.on('completed', (job) => {
  console.log(`✅ Job completed for user: ${job.data.email || job.data.Email}`);
});

worker.on('failed', (job, err) => {
  console.error(`❌ Job failed for user: ${job.data.email || job.data.Email}`, err);
});

console.log('👷 Worker is running and waiting for jobs...');

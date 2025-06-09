// const Redis = require("ioredis");

// const redis = new Redis({
//   host: 'redis-18571.c84.us-east-1-2.ec2.redns.redis-cloud.com',
//   port: 18571,
//   username: 'default',
//   password: 'faUGC1GGBeJvpNOmgHo8hAfkQ1l79SyT',
//   // ❌ remove tls
// });

// redis.set('hello', 'without TLS').then(() => {
//   return redis.get('hello');
// }).then((result) => {
//   console.log("✅ Redis is working (non-TLS): ", result);
//   redis.quit();
// }).catch((err) => {
//   console.error("❌ Redis connection failed:", err);
// });

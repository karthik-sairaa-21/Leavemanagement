require('dotenv').config();

const Hapi = require('@hapi/hapi');
const leaveroute = require('./routes/leaveRoutes');
const { connectDB } = require('./config/db');

const init = async () => {
  await connectDB(); // Make sure DB is connected before server starts

  const server = Hapi.server({
    port: process.env.PORT ,
    host: 'localhost', //
    routes: {
      cors: {
        origin: ['*'],         // Allow all origins for development
        credentials: true      // Optional: allow credentials like cookies
      }
    }
  });
  server.route(leaveroute);
  
  await server.start();
  console.log('🚀 Server running on %s', server.info.uri);
};

init();

module.exports = init;

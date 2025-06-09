require('dotenv').config();


const Hapi = require('@hapi/hapi');
const leaveroute = require('./routes/leaveRoutes');
const { connectDB } = require('./config/db');

const init = async () => {
  await connectDB();

  const server = Hapi.server({
    port: process.env.PORT,
    host: 'localhost',
    routes: {
      cors: {
        origin: ['*'],
        credentials: true
      }
    }
  });

  server.route(leaveroute);


  await server.start();
  console.log('🚀 Server running on %s', server.info.uri);
};

init();



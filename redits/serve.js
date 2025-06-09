
const Hapi = require('@hapi/hapi');
const Inert = require('@hapi/inert');
const Redis = require('ioredis');
const { Queue } = require('bullmq');
const config = require('./confi');
const fs = require('fs').promises;
const { parse } = require('csv-parse/sync');
const ExcelJS = require('exceljs');

const redisConnection = new Redis(config.redisConfig);
const userQueue = new Queue('userQueue', { connection: redisConnection });

async function init() {
  const server = Hapi.server({ port: 3000, host: 'localhost' });
  await server.register(Inert);

  server.route({
    method: 'GET',
    path: '/',
    handler: () => `
      <form action="/upload" method="post" enctype="multipart/form-data">
        <input type="file" name="file" />
        <button type="submit">Upload</button>
      </form>
    `,
  });

  server.route({
    method: 'POST',
    path: '/upload',
    options: {
      payload: {
        maxBytes: 10 * 1024 * 1024,
        parse: true,
        multipart: true,
        output: 'file',
      },
      handler: async (request, h) => {
        const file = request.payload.file;
        if (!file) return h.response('No file uploaded').code(400);

        const filename = (file.filename || '').toLowerCase();
        const buffer = await fs.readFile(file.path);
        let users = [];

        if (filename.endsWith('.csv')) {
          users = parse(buffer.toString('utf8'), {
            columns: true,
            skip_empty_lines: true,
          });
        } else if (filename.endsWith('.xlsx') || filename.endsWith('.xls')) {
          const workbook = new ExcelJS.Workbook();
          await workbook.xlsx.load(buffer);
          const sheet = workbook.worksheets[0];
          const headers = [];
          sheet.getRow(1).eachCell(cell => headers.push(cell.text.trim()));
          sheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return;
            const user = {};
            row.eachCell((cell, colNumber) => {
              user[headers[colNumber - 1]] = (cell.text || '').trim();
            });
            users.push(user);
          });
        } else {
          return h.response('Unsupported file type').code(400);
        }

        // Sort by role hierarchy for correct insert order
        const roleOrder = { DIRECTOR: 1, HR: 2, MANAGER: 3, EMPLOYEE: 4 };
        users.sort((a, b) => {
          const roleA = (a.role || a.Role || '').toUpperCase();
          const roleB = (b.role || b.Role || '').toUpperCase();
          return (roleOrder[roleA] || 99) - (roleOrder[roleB] || 99);
        });

        // Queue users for insertion
        for (const user of users) {
          await userQueue.add('addUser', user);
        }

        return h.response(`${users.length} users queued for insertion`).code(200);
      },
    },
  });

  await server.start();
  console.log('🚀 Server running on', server.info.uri);
}

init();

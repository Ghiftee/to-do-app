const express = require('express');
const path = require('node:path');
const { JsonStore } = require('./services/store');
const { createTodoRouter } = require('./routes/todos');
const { createNoteRouter } = require('./routes/notes');
const { createStatsRouter } = require('./routes/stats');

function createApp(options = {}) {
  const app = express();
  const dataFile = options.dataFile || process.env.DATA_FILE || path.join(__dirname, '..', 'data', 'db.json');
  const store = options.store || new JsonStore(dataFile);

  app.disable('x-powered-by');
  app.use(express.json({ limit: '100kb' }));

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use('/api/todos', createTodoRouter(store));
  app.use('/api/notes', createNoteRouter(store));
  app.use('/api/stats', createStatsRouter(store));

  app.use(express.static(path.join(__dirname, '..', 'public')));

  app.use('/api', (req, res) => {
    res.status(404).json({ error: 'API route not found.' });
  });

  app.use((error, req, res, next) => {
    console.error(error);
    res.status(500).json({ error: 'Internal server error.' });
  });

  return app;
}

module.exports = { createApp };

const { createApp } = require('./src/app');

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const app = createApp();

app.listen(PORT, HOST, () => {
  console.log(`Todo + Notes app running on http://${HOST}:${PORT}`);
});

const express = require('express');
const syncRoute = require('./src/syncRoute');
const loggerRoute = require('./src/loggerRoute');

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api', syncRoute);
app.use('/api', loggerRoute);

const PORT = process.env.PORT || 4000;
app.listen(PORT, '0.0.0.0', () => console.log(`AWS Datalake 3.0 Edge Node running on 0.0.0.0:${PORT}`));

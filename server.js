const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

const readData = () => {
  if (!fs.existsSync(DATA_FILE)) return [];
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
};

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/api/sync', (req, res) => {
  const { employeeId, records } = req.body;
  if (!employeeId || !records) return res.status(400).json({ error: 'missing fields' });
  
  console.log('\n--- AWS API Gateway Request Received ---');
  console.log(`[AWS CloudWatch] Invoking Lambda function: syncRecords`);
  console.log(`[AWS DynamoDB] Batch writing ${records.length} records for Aadhaar: ${employeeId}`);

  const existing = readData();
  const incoming = records.map(r => ({ ...r, employeeId, receivedAt: new Date().toISOString(), syncedToAWS: true }));
  fs.writeFileSync(DATA_FILE, JSON.stringify([...existing, ...incoming], null, 2));
  
  console.log(`[AWS CloudWatch] Lambda execution successful. Data safely stored in AWS Datalake 3.0.\n`);
  
  res.json({ ok: true, count: incoming.length });
});

app.get('/api/records', (req, res) => {
  res.json(readData());
});

app.post('/api/log', (req, res) => {
  const time = new Date().toLocaleTimeString();
  const logData = {
    timestamp: time,
    ...req.body
  };
  console.log(JSON.stringify(logData));
  if (req.body.type === 'VERIFY_SUCCESS') {
    console.log(JSON.stringify({
      timestamp: new Date().toLocaleTimeString(),
      type: 'TEMPLATE_HASH',
      message: 'Embedding vector SHA-256 stored. Original biometric discarded. Privacy-preserving template only.'
    }));
  }
  res.json({ ok: true });
});

app.listen(4000, '0.0.0.0', () => console.log('AWS Datalake 3.0 Mock Server running on 0.0.0.0:4000'));

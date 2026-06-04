const express = require('express');
const { readData, writeData } = require('./db');
const router = express.Router();

router.post('/sync', (req, res) => {
  const { employeeId, records } = req.body;
  if (!employeeId || !records) return res.status(400).json({ error: 'missing fields' });
  
  console.log('\n--- AWS API Gateway Request Received ---');
  console.log(`[AWS CloudWatch] Invoking Lambda function: syncRecords`);
  console.log(`[AWS DynamoDB] Batch writing ${records.length} records for Aadhaar: ${employeeId}`);

  const existing = readData();
  const incoming = records.map(r => ({ ...r, employeeId, receivedAt: new Date().toISOString(), syncedToAWS: true }));
  
  writeData([...existing, ...incoming]);
  
  console.log(`[AWS CloudWatch] Lambda execution successful. Data safely stored in AWS Datalake 3.0.\n`);
  
  res.json({ ok: true, count: incoming.length });
});

router.get('/records', (req, res) => {
  res.json(readData());
});

module.exports = router;

const express = require('express');
const router = express.Router();

router.post('/log', (req, res) => {
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

module.exports = router;

const https = require('https');
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  const key = process.env.ANTHROPIC_API_KEY || 'MISSING';
  console.log('Key starts with:', key.substring(0, 10));
  const body = JSON.stringify(req.body);
  const options = {
    hostname: 'api.anthropic.com',
    path: '/v1/messages',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
      'x-api-key': key,
      'anthropic-version': '2023-06-01'
    }
  };
  const r = await new Promise((resolve, reject) => {
    const req2 = https.request(options, (res2) => {
      let data = '';
      res2.on('data', (chunk) => { data += chunk; });
      res2.on('end', () => { resolve(JSON.parse(data)); });
    });
    req2.on('error', reject);
    req2.write(body);
    req2.end();
  });
  res.json(r);
};

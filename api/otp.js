const https = require('https');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const { mobile, otp, action } = req.body;

  if (action === 'send') {
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const message = encodeURIComponent('Your Jan Setu verification OTP is ' + generatedOtp + '. Valid for 10 minutes.');
    const url = 'https://www.fast2sms.com/dev/bulkV2?authorization=' + process.env.FAST2SMS_API_KEY + '&route=q&message=' + message + '&language=english&flash=0&numbers=' + mobile;
    
    const result = await new Promise((resolve, reject) => {
      https.get(url, (r) => {
        let data = '';
        r.on('data', chunk => data += chunk);
        r.on('end', () => resolve(JSON.parse(data)));
      }).on('error', reject);
    });

    if (result.return) {
      res.json({ success: true, otp: generatedOtp });
    } else {
      res.json({ success: false, error: result.message });
    }
  }
};

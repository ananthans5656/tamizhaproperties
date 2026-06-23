const router = require('express').Router();

// In-memory OTP store: phone → { otp, expires }
const otpStore = new Map();

function generateOTP() {
  if (process.env.MOCK_OTP === 'true') return '12345';
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendViaSMS(phone, otp) {
  const apiKey = process.env.VONAGE_API_KEY;
  const apiSecret = process.env.VONAGE_API_SECRET;
  if (!apiKey || !apiSecret) return false;

  const body = JSON.stringify({
    api_key: apiKey,
    api_secret: apiSecret,
    to: phone.replace(/^\+/, ''),
    from: process.env.VONAGE_SENDER || 'Tamizha',
    text: `Your Tamizha Properties verification code is: ${otp}. Valid for 5 minutes. Do not share this code.`,
  });

  const res = await fetch('https://rest.nexmo.com/sms/json', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });
  const data = await res.json();
  const status = data?.messages?.[0]?.status;
  if (status !== '0') {
    console.error('Vonage SMS error:', data?.messages?.[0]);
    return false;
  }
  return true;
}

// POST /api/otp/send
router.post('/send', async (req, res) => {
  const { phone } = req.body;
  if (!phone || phone.trim().length < 7) {
    return res.status(400).json({ error: 'Valid phone number required' });
  }

  const otp = generateOTP();
  otpStore.set(phone, { otp, expires: Date.now() + 5 * 60 * 1000 });

  const isDev = !process.env.VONAGE_API_KEY || !process.env.VONAGE_API_SECRET;

  if (isDev) {
    // Dev mode — log to console, return OTP in response for testing
    console.log(`\n🔐 OTP for ${phone}: ${otp}\n`);
    return res.json({ success: true, dev: true, otp, message: `Dev mode: OTP is ${otp}` });
  }

  try {
    const sent = await sendViaSMS(phone, otp);
    if (!sent) return res.status(500).json({ error: 'SMS failed. Check Vonage credentials.' });
    res.json({ success: true, message: 'OTP sent to ' + phone });
  } catch (err) {
    console.error('OTP send error:', err.message);
    res.status(500).json({ error: 'SMS sending failed' });
  }
});

// POST /api/otp/verify
router.post('/verify', (req, res) => {
  const { phone, otp } = req.body;
  if (!phone || !otp) return res.status(400).json({ error: 'Phone and OTP required' });

  const entry = otpStore.get(phone);
  if (!entry) return res.status(400).json({ error: 'No OTP found. Please request a new code.' });
  if (Date.now() > entry.expires) {
    otpStore.delete(phone);
    return res.status(400).json({ error: 'OTP expired. Please request a new one.' });
  }
  if (entry.otp !== otp) return res.status(400).json({ error: 'Invalid OTP. Please try again.' });

  otpStore.delete(phone);
  res.json({ success: true, message: 'Phone verified successfully' });
});

module.exports = router;

/**
 * Production-ready server for TimePriority subscription API
 * - Accepts JSON POST /api/subscribe
 * - Sends email to client via SMTP (Nodemailer)
 * - Optionally notifies BUSINESS_EMAIL
 * - Restricts CORS to ALLOWED_ORIGINS env var (comma-separated)
 * - Always returns JSON (including 404)
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const helmet = require('helmet');

const app = express();

// Basic security headers
app.use(helmet());

// Parse JSON bodies
app.use(express.json());

// Configure CORS: read allowed origins from env var (fallback to known production domains)
const configured = (process.env.ALLOWED_ORIGINS || '').trim();
const rawOrigins = (configured ? configured.split(',') : ['https://timepriority.lv','https://www.timepriority.lv']).map(s => s.trim()).filter(Boolean);
const corsOptions = {
  origin: function(origin, callback){
    // allow requests with no origin (e.g., server-to-server or curl)
    if(!origin) return callback(null, true);
    if(rawOrigins.length === 0){
      // if not configured, deny cross-origin by default
      return callback(new Error('CORS origin denied'));
    }
    if(rawOrigins.indexOf(origin) !== -1){
      return callback(null, true);
    } else {
      return callback(new Error('CORS origin denied'));
    }
  }
};
app.use((req, res, next) => {
  // wrap cors middleware to return JSON error on CORS failure
  cors(corsOptions)(req, res, function(err){
    if(err){
      console.warn('CORS denied for origin:', req.headers.origin);
      return res.status(403).json({ ok: false, error: 'CORS origin denied' });
    }
    next();
  });
});

// Health check route - should be reachable and return JSON
app.get('/health', (req, res) => {
  console.log('/health ping from', req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress);
  return res.json({ ok: true, status: 'ok' });
});

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.hostinger.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: (process.env.SMTP_SECURE === 'true') || false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Optional: verify transporter at startup, logs a warning but does not crash
transporter.verify().then(() => console.log('SMTP transporter verified')).catch(err => console.warn('SMTP verify failed:', err && err.message));

// POST /api/subscribe
app.post('/api/subscribe', async (req, res) => {
  try {
    console.log('/api/subscribe payload:', req.body);
    const { plan, fname, lname, phone, email } = req.body || {};
    if(!plan || !fname || !lname || !email) return res.status(400).json({ ok: false, error: 'Missing required fields' });

    const subject = `TimePriority — Subscription received: ${plan}`;
    const text = `Hello ${fname} ${lname},\n\n` +
      `Thank you for subscribing to our ${plan} plan. We received your request and will contact you shortly to confirm details.\n\n` +
      `Summary:\n` +
      `Plan: ${plan}\n` +
      `Name: ${fname} ${lname}\n` +
      `Phone: ${phone || 'N/A'}\n` +
      `Email: ${email}\n\n` +
      `If you need immediate assistance, reply to this email or contact us via Telegram.`;

    const mailOptions = {
      from: process.env.FROM_EMAIL || process.env.SMTP_USER,
      to: email,
      subject,
      text,
      // Uncomment and adjust to include an attachments array (e.g., PDF invoice)
      // attachments: [ { filename: 'invoice.pdf', path: '/tmp/invoice.pdf' } ]
    };

  // send to client
    console.log('Sending client email to', email);
    try{
      await transporter.sendMail(mailOptions);
      console.log('Client email sent to', email);
    } catch(sendErr){
      console.error('Failed to send client email:', sendErr && sendErr.message);
      return res.status(502).json({ ok: false, error: 'Failed to send email' });
    }

    // notify business if configured (do not block client response on failure)
    if(process.env.BUSINESS_EMAIL){
      const adminOptions = {
        from: process.env.FROM_EMAIL || process.env.SMTP_USER,
        to: process.env.BUSINESS_EMAIL,
        subject: `New subscription: ${plan} — ${fname} ${lname}`,
        text: `New subscription received:\n\n${JSON.stringify({ plan, fname, lname, email, phone }, null, 2)}`
      };
      transporter.sendMail(adminOptions).catch(err => console.warn('Admin notification failed:', err && err.message));
    }

    return res.json({ ok: true, message: 'E-mail sent' });
  } catch (err) {
    console.error('Error /api/subscribe', err && err.message);
    return res.status(500).json({ ok: false, error: 'Internal server error' });
  }
});

// JSON 404 handler
app.use((req, res) => res.status(404).json({ ok: false, error: 'Not found' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`TimePriority API listening on port ${PORT}`));


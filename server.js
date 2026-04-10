/**
 * TimePriority API
 * - GET /health
 * - POST /api/subscribe
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { sendEmailResend } = require('./utils/sendEmailResend');

const app = express();

app.use(helmet());
app.use(express.json());

const defaultAllowedOrigins = [
  'https://timepriority.lv',
  'https://www.timepriority.lv',
];

const allowedFromEnv = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(v => v.trim())
  .filter(Boolean);

const allowedOrigins = Array.from(new Set([...defaultAllowedOrigins, ...allowedFromEnv]));

app.use((req, res, next) => {
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('CORS origin denied'));
    },
  })(req, res, (err) => {
    if (err) return res.status(403).json({ ok: false, error: 'CORS origin denied' });
    return next();
  });
});

app.get('/health', (_req, res) => {
  return res.json({ ok: true });
});

app.post('/api/subscribe', async (req, res) => {
  const body = req.body || {};

  // New API contract
  // {
  //   name: string,
  //   email: string,
  //   plan: string,
  //   message: string
  // }
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const plan = typeof body.plan === 'string' ? body.plan.trim() : '';
  const message = typeof body.message === 'string' ? body.message.trim() : '';

  const missingFields = [];
  if (!name) missingFields.push('name');
  if (!email) missingFields.push('email');
  if (!plan) missingFields.push('plan');
  if (!message) missingFields.push('message');

  if (missingFields.length > 0) {
    return res.status(400).json({
      ok: false,
      error: `Missing required fields: ${missingFields.join(', ')}`,
    });
  }

  let clientEmailSent = false;
  let businessEmailSent = false;

  const clientSubject = `TimePriority — request received (${plan})`;
  const clientHtml = `
    <p>Hello, ${name}.</p>
    <p>We received your request for <strong>${plan}</strong>.</p>
    <p>Thank you. After the invoice is paid, our agent will contact you.</p>
  `;

  const businessSubject = `New subscription request: ${plan}`;
  const businessHtml = `
    <h3>New TimePriority request</h3>
    <p><strong>Name:</strong> ${name}</p>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Plan:</strong> ${plan}</p>
    <p><strong>Message:</strong></p>
    <pre>${message}</pre>
  `;

  try {
    await sendEmailResend({ to: email, subject: clientSubject, html: clientHtml });
    clientEmailSent = true;
  } catch (err) {
    console.error('Client email send failed:', err && err.message ? err.message : err);
  }

  try {
    if (process.env.BUSINESS_EMAIL) {
      await sendEmailResend({ to: process.env.BUSINESS_EMAIL, subject: businessSubject, html: businessHtml });
      businessEmailSent = true;
    }
  } catch (err) {
    console.error('Business email send failed:', err && err.message ? err.message : err);
  }

  return res.json({
    ok: true,
    delivery: {
      clientEmailSent,
      businessEmailSent,
    },
  });
});

app.use((_req, res) => res.status(404).json({ ok: false, error: 'Not found' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`TimePriority API listening on port ${PORT}`);
});

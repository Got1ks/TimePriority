// Simple Express server to handle subscription emails via Nodemailer
// Usage:
// 1. npm install
// 2. Create a .env file with SMTP credentials (see .env.example)
// 3. node server.js

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();
// allow cross-origin requests (in production, restrict origin)
app.use(cors());
// parse JSON bodies
app.use(express.json());
app.use(express.static(path.join(__dirname, '.'))); // serve static files optionally

// Create a Nodemailer transporter using SMTP (Hostinger example)
// For Hostinger SMTP config use values from your Hostinger account
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST, // e.g. "smtp.hostinger.com"
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER, // your email account
    pass: process.env.SMTP_PASS, // your email password or app-specific password
  }
});

// Verify transporter at startup (optional)
transporter.verify().then(() => {
  console.log('SMTP transporter verified');
}).catch(err => {
  console.warn('Warning: SMTP transporter verification failed. Emails may not send until configured correctly.', err.message);
});

// POST /api/subscribe
// Expected JSON body: { plan: 'Basic Priority', fname: 'John', lname: 'Doe', email: 'john@example.com', phone: '...' }
app.post('/api/subscribe', async (req, res) => {
  try {
    const { plan, fname, lname, email, phone } = req.body || {};
  if(!plan || !fname || !lname || !email) return res.status(400).json({ ok: false, error: 'Missing required fields' });

    // Compose the email body - plain text for now
    const subject = `TimePriority — Subscription received: ${plan}`;
    const text = `Hello ${fname} ${lname},\n\n` +
      `Thank you for subscribing to our ${plan} plan. We received your request and will contact you shortly to confirm details.\n\n` +
      `Summary:\n` +
      `Plan: ${plan}\n` +
      `Name: ${fname} ${lname}\n` +
      `Phone: ${phone || 'N/A'}\n` +
      `Email: ${email}\n\n` +
      `If you need immediate assistance, reply to this email or contact us via Telegram.`;

    // The mail options for the client
    const mailOptions = {
      from: process.env.FROM_EMAIL || process.env.SMTP_USER,
      to: email,
      subject,
      text,
      // html: '<p>HTML version</p>', // future: add HTML body
      // attachments: [ { filename: 'invoice.pdf', path: '/path/to/invoice.pdf' } ] // future: attach PDF
    };

    // Send email to client
    await transporter.sendMail(mailOptions);

    // Optionally, also send a notification to the business email
    if(process.env.BUSINESS_EMAIL){
      const adminMail = {
        from: process.env.FROM_EMAIL || process.env.SMTP_USER,
        to: process.env.BUSINESS_EMAIL,
        subject: `New subscription: ${plan} — ${fname} ${lname}`,
        text: `New subscription received:\n\n${JSON.stringify({ plan, fname, lname, email, phone }, null, 2)}`
      };
      transporter.sendMail(adminMail).catch(err => console.warn('Failed to send admin notification', err.message));
    }

    return res.json({ ok: true, message: 'E-pasts nosūtīts klientam.' });
  } catch (err) {
    console.error('Error in /api/subscribe', err);
    return res.status(500).json({ ok: false, error: 'Internal server error' });
  }
});

// Fallback 404 handler - return JSON so client JSON.parse won't fail
app.use((req, res) => res.status(404).json({ ok: false, error: 'Not found' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));

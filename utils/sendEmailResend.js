// utils/sendEmailResend.js
// Uses global fetch (Node 18+). If you run on older Node, install node-fetch and adjust this module.

async function sendEmailResend({ to, subject, html }) {
  if(!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY not set');
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.FROM_EMAIL,
      to: [to],
      subject,
      html,
    }),
  });
  if(!r.ok){
    const text = await r.text();
    throw new Error(`Resend ${r.status} ${text}`);
  }
  return r.json();
}

module.exports = { sendEmailResend };

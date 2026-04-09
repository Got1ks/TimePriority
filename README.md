# TimePriority - Local Email Server

This repository contains a static frontend (`index.html`, `subscribe.html`) and a minimal Node.js server (`server.js`) to send subscription confirmation emails using Resend API.

## Setup (local)

1. Install dependencies

   npm install

2. Copy `.env.example` to `.env` and fill in your configuration values. Example:

   RESEND_API_KEY=re_xxxxxxxxx
   FROM_EMAIL=info@timepriority.lv
   BUSINESS_EMAIL=info@timepriority.lv
   ALLOWED_ORIGINS=https://timepriority.lv,https://www.timepriority.lv
   PORT=3000

3. Run the server

   npm run start

4. Open the frontend

   - Visit http://localhost:3000/subscribe.html?plan=Basic%20Priority to test the form.

## How it works

- `POST /api/subscribe` accepts JSON: `{ name, email, plan, message }`.
- `server.js` uses Resend API to send one email to the client and one email to `BUSINESS_EMAIL`.
- The API response includes `delivery.clientEmailSent` and `delivery.businessEmailSent`.

## Future improvements

- Attach a generated PDF invoice/contract: add an `attachments` array to `mailOptions` in `server.js` and generate PDF server-side.
- Add logging/persistence (database) for subscriptions.
- Add verification (CAPTCHA) and input sanitization for production.

## Security

- Keep API keys secret. Do NOT commit `.env` with real secrets.
- For production, make sure `FROM_EMAIL` uses a domain verified in Resend.

## Troubleshooting: "Where was `info@timepriority.lv` created?"

This repository does **not** store mailbox provider credentials (cPanel, Hostinger, Google Workspace, etc.). It only stores:

- sender identity variable: `FROM_EMAIL`
- API key variable for Resend delivery: `RESEND_API_KEY`

To find the mailbox provider where `info@timepriority.lv` was originally created, check:

1. DNS records of `timepriority.lv` (MX records show incoming mail provider).
2. Registrar/hosting control panel linked to the domain.
3. Old invoices or billing emails (Hostinger, Namecheap, Zoho, Google Workspace, etc.).
4. Browser password manager entries for `info@timepriority.lv`.

### If your Hostinger subscription expired

After renewing Hostinger, verify this checklist before testing the form again:

1. Domain DNS is active and MX records are restored.
2. Mailbox `info@timepriority.lv` exists and you can log in to webmail.
3. In Render, `FROM_EMAIL=info@timepriority.lv` and `RESEND_API_KEY` are set.
4. In Resend, the sending domain is verified (SPF/DKIM status is green).

### If your domain holder/registrant data is outdated

If you cannot add DNS records because ownership data is outdated, do this first:

1. Update domain contact/holder data at the registrar (whois/contact profile).
2. Confirm email/phone ownership requested by registrar (ICANN verification flow).
3. Ensure nameservers are controlled by the same provider where you edit DNS.
4. Only after this, add/restore SPF + DKIM + MX records required by your mail setup.

Hostinger panel warnings like SPF/DKIM yellow status usually mean DNS records are missing in the currently active DNS zone.

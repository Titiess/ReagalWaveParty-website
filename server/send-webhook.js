import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Simple CLI parsing (no deps). Usage examples below.
const argv = process.argv.slice(2);
const args = {};
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a.startsWith('--')) {
    const key = a.slice(2);
    const val = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : 'true';
    args[key] = val;
  }
}

const ngrokUrl = args.url || process.env.NGROK_URL;
const secret = args.secret || process.env.FLUTTERWAVE_WEBHOOK_SECRET;
const ticketId = args.ticketId || process.env.TICKET_ID || 'RSG-PPOOL-123456';
const amount = Number(args.amount || process.env.AMOUNT || 3000);
const email = args.email || process.env.CUSTOMER_EMAIL || 'buyer@example.com';
const name = args.name || process.env.CUSTOMER_NAME || 'Buyer Name';
const flwRef = args.flwRef || process.env.FLW_REF || 'FLWREF123';

if (!ngrokUrl) {
  console.error('Missing ngrok URL. Provide --url https://abcd-1234.ngrok.io or set NGROK_URL env var.');
  process.exit(1);
}
if (!secret) {
  console.error('Missing webhook secret. Provide --secret <FLUTTERWAVE_WEBHOOK_SECRET> or set FLUTTERWAVE_WEBHOOK_SECRET env var.');
  process.exit(1);
}

const payload = {
  event: 'charge.completed',
  data: {
    status: 'successful',
    tx_ref: ticketId,
    amount: amount,
    currency: 'NGN',
    flw_ref: flwRef,
    customer: {
      email: email,
      name: name,
    },
  },
};

const body = JSON.stringify(payload);

function computeSignature(secretKey, bodyStr) {
  return crypto.createHmac('sha256', secretKey).update(bodyStr).digest('base64');
}

const signature = computeSignature(secret, body);

async function sendWebhook() {
  try {
    const endpoint = new URL('/api/webhooks/flutterwave', ngrokUrl).toString();
    console.log('Posting webhook to:', endpoint);
    console.log('Payload:', body);
    console.log('Signature (base64):', signature);

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'flutterwave-signature': signature,
      },
      body,
    });

    const text = await res.text();
    console.log('Response status:', res.status);
    console.log('Response body:', text);
  } catch (err) {
    console.error('Error sending webhook:', err);
    process.exit(1);
  }
}

sendWebhook();

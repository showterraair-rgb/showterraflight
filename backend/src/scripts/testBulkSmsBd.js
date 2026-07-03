/**
 * Test BulkSMSBD API using credentials from environment.
 *
 * Usage:
 *   BULKSMSBD_API_KEY=... BULKSMSBD_SENDER_ID=8809648909214 node src/scripts/testBulkSmsBd.js
 *   node src/scripts/testBulkSmsBd.js --send --to 8801674533303
 */
import { env } from '../config/env.js';
import { testBulkSmsBdConnection, BULKSMSBD_DEFAULTS } from '../services/sms/bulksmsbd.provider.js';

function readArg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : '';
}

async function run() {
  const apiKey = env.sms.apiKey || readArg('--api-key');
  const senderId = env.sms.senderId || readArg('--sender-id') || BULKSMSBD_DEFAULTS.senderId;
  const testNumber = readArg('--to') || '8801741148529';
  const send = process.argv.includes('--send');

  if (!apiKey) {
    console.error('Set BULKSMSBD_API_KEY in .env or pass --api-key');
    process.exit(1);
  }

  console.log('BulkSMSBD connection test');
  console.log('API URL:', env.sms.apiUrl || BULKSMSBD_DEFAULTS.apiUrl);
  console.log('Balance URL:', env.sms.balanceUrl || BULKSMSBD_DEFAULTS.balanceUrl);
  console.log('Sender ID (input):', senderId);
  console.log('Send test:', send ? `yes → ${testNumber}` : 'no (pass --send --to 88017...)');

  const result = await testBulkSmsBdConnection({
    apiKey,
    senderId,
    apiUrl: env.sms.apiUrl,
    balanceUrl: env.sms.balanceUrl,
    testNumber,
    send,
  });

  console.log('\n--- Balance ---');
  console.log(JSON.stringify(result.balance, null, 2));
  console.log('\n--- Sender ---');
  console.log('API senderid:', result.apiSenderId);
  console.log('Display:', result.displaySenderId);
  if (result.sampleUrl) {
    console.log('\n--- Sample URL (key masked) ---');
    console.log(result.sampleUrl);
  }
  if (result.send) {
    console.log('\n--- Send result ---');
    console.log(JSON.stringify(result.send, null, 2));
  }

  const ok = result.balance?.success && (!send || result.send?.success);
  process.exit(ok ? 0 : 1);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

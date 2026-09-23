import fs from 'fs';
import path from 'path';

const API_URL = 'http://localhost:3001/api/v1';
const SYNC_LOG_PATH = path.resolve('../hajj-umrah-backend/e2e-sync-log.json');

function log(msg) {
  console.log(`[CLIENT FLOW] ${new Date().toISOString()} - ${msg}`);
}

function readSyncLog() {
  if (!fs.existsSync(SYNC_LOG_PATH)) {
    throw new Error(`Sync log file not found at ${SYNC_LOG_PATH}`);
  }
  const content = fs.readFileSync(SYNC_LOG_PATH, 'utf-8');
  return JSON.parse(content);
}

function writeSyncLog(data) {
  fs.writeFileSync(SYNC_LOG_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

function updateSyncLogStep(nextStep, dataPatch = {}, message = '') {
  const syncLog = readSyncLog();
  syncLog.current_step = nextStep;
  syncLog.data = {
    ...(syncLog.data || {}),
    ...dataPatch,
  };
  if (!syncLog.history) syncLog.history = [];
  syncLog.history.push({
    step: nextStep,
    agent: 'CLIENT',
    timestamp: new Date().toISOString(),
    message: message || `Updated step to ${nextStep}`,
  });
  writeSyncLog(syncLog);
  log(`Updated e2e-sync-log.json -> current_step: ${nextStep}`);
}

function recordError(errorMsg, details = null) {
  const syncLog = readSyncLog();
  syncLog.current_step = 'CLIENT_ERROR';
  if (!syncLog.issues) syncLog.issues = [];
  syncLog.issues.push({
    agent: 'CLIENT',
    timestamp: new Date().toISOString(),
    error: errorMsg,
    details: details || errorMsg,
  });
  syncLog.history.push({
    step: 'CLIENT_ERROR',
    agent: 'CLIENT',
    timestamp: new Date().toISOString(),
    message: `Client error: ${errorMsg}`,
  });
  writeSyncLog(syncLog);
  log(`Recorded error to e2e-sync-log.json: ${errorMsg}`);
}

async function apiRequest(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const text = await response.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch (e) {
    json = { raw: text };
  }

  if (!response.ok) {
    const errMsg = json?.message || json?.error || `HTTP ${response.status} from ${endpoint}`;
    const err = new Error(Array.isArray(errMsg) ? errMsg.join(', ') : errMsg);
    err.status = response.status;
    err.body = json;
    throw err;
  }

  return json;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c == 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

async function runClientFlow() {
  log('Starting Client Customer Flow Agent monitor...');
  let authToken = null;
  let currentUser = null;
  let currentBooking = null;

  while (true) {
    let syncLog;
    try {
      syncLog = readSyncLog();
    } catch (err) {
      log(`Waiting for sync log: ${err.message}`);
      await sleep(2000);
      continue;
    }

    const currentStep = syncLog.current_step;
    log(`Current sync log step: ${currentStep}`);

    if (currentStep === 'START') {
      try {
        log('--- STEP 1: Registration & Login ---');
        const randomNum = Math.floor(Math.random() * 100000);
        const email = `e2e_client_${randomNum}@pilgrim.test`;
        const password = 'Password123!';
        const name = `E2E Pilgrim ${randomNum}`;
        const phone = `+88017${String(randomNum).padStart(8, '0')}`;

        log(`Registering user: ${email}`);
        const regRes = await apiRequest('/auth/register', {
          method: 'POST',
          body: JSON.stringify({
            name,
            email,
            password,
            phone,
          }),
        });

        const authData = regRes.data || regRes;
        authToken = authData.accessToken || authData.access_token || authData.token;
        currentUser = authData.user || {
          id: authData.userId || authData.id,
          name,
          email,
        };

        if (!authToken) {
          log('Logging in to retrieve auth token...');
          const loginRes = await apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
          });
          const loginData = loginRes.data || loginRes;
          authToken = loginData.accessToken || loginData.access_token || loginData.token;
          currentUser = loginData.user || currentUser;
        }

        log(`User authenticated! User ID: ${currentUser.id}`);

        log('--- STEP 2: Package Selection & Booking ---');
        const packagesRes = await apiRequest('/packages');
        const packagesList = packagesRes.data || packagesRes || [];
        if (!packagesList.length) {
          throw new Error('No packages available in the system to book');
        }

        const selectedPackage = packagesList[0];
        log(`Selected Package: ${selectedPackage.name} (ID: ${selectedPackage.id})`);

        let selectedTier = selectedPackage.tiers && selectedPackage.tiers[0];
        if (!selectedTier) {
          const packageDetailRes = await apiRequest(`/packages/${selectedPackage.id}`);
          const pkgDetail = packageDetailRes.data || packageDetailRes;
          selectedTier = pkgDetail.tiers && pkgDetail.tiers[0];
        }

        if (!selectedTier) {
          throw new Error(`Package ${selectedPackage.id} has no pricing tiers`);
        }

        log(`Selected Tier: ${selectedTier.name} (Price: ${selectedTier.price})`);

        const idempotencyKey = generateUUID();
        const bookingPayload = {
          packageId: selectedPackage.id,
          tierId: selectedTier.id,
          paymentMode: 'FULL',
          pilgrims: [
            {
              fullName: name,
              passportNumber: `A${Math.floor(10000000 + Math.random() * 90000000)}`,
              nationality: 'Bangladesh',
              dateOfBirth: '1992-04-12',
              passportExpiry: '2032-04-12',
            },
          ],
        };

        log('Submitting booking...');
        const bookingRes = await apiRequest('/bookings', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Idempotency-Key': idempotencyKey,
          },
          body: JSON.stringify(bookingPayload),
        });

        currentBooking = bookingRes.data || bookingRes;
        log(`Booking Created! Booking ID: ${currentBooking.id}, Status: ${currentBooking.status}`);

        updateSyncLogStep(
          'BOOKING_CREATED',
          {
            bookingId: currentBooking.id,
            userId: currentUser.id,
            packageId: selectedPackage.id,
            tierId: selectedTier.id,
            userEmail: email,
            userPassword: password,
            authToken: authToken,
            bookingTotal: currentBooking.totalAmount || currentBooking.total_amount || selectedTier.price,
          },
          `Created booking #${currentBooking.id} for user ${currentUser.id}`
        );
      } catch (err) {
        log(`Error during registration/booking: ${err.message}`);
        recordError(err.message, err.body || err.stack);
      }
    } else if (currentStep === 'BACKEND_VERIFIED_BOOKING') {
      try {
        log('--- STEP 3: Payment Execution ---');
        const bookingId = syncLog.data?.bookingId || currentBooking?.id;
        const storedToken = syncLog.data?.authToken || authToken;
        const amount = syncLog.data?.bookingTotal || currentBooking?.totalAmount || 50000;

        if (!bookingId) {
          throw new Error('Missing bookingId in sync log data');
        }

        log(`Initiating payment for booking ${bookingId}, amount: ${amount}`);
        const idempotencyKey = generateUUID();
        const initiateRes = await apiRequest('/payments/initiate', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${storedToken}`,
            'Idempotency-Key': idempotencyKey,
          },
          body: JSON.stringify({
            bookingId,
            amount: Number(amount),
            provider: 'BKASH',
          }),
        });

        const initData = initiateRes.data || initiateRes;
        const paymentId = initData.paymentId || initData.id || initData.payment_id;
        const trxId =
          initData.gatewayTransactionId ||
          initData.gateway_transaction_id ||
          initData.transactionId ||
          `TRX-${Date.now()}`;

        log(`Payment session initiated. Payment ID: ${paymentId}, Transaction ID: ${trxId}`);

        log('Triggering simulated gateway webhook...');
        const webhookRes = await apiRequest('/payments/webhook/bkash', {
          method: 'POST',
          body: JSON.stringify({
            event_id: `evt_${Date.now()}`,
            transaction_id: trxId,
            transactionId: trxId,
            payment_id: paymentId,
            paymentId: paymentId,
            status: 'SUCCESS',
            amount: Number(amount),
            booking_id: bookingId,
            bookingId: bookingId,
          }),
        });

        log('Webhook triggered successfully');

        updateSyncLogStep(
          'PAYMENT_COMPLETED',
          {
            paymentId,
            transactionId: trxId,
          },
          `Completed payment for booking #${bookingId} (TrxID: ${trxId})`
        );
      } catch (err) {
        log(`Error during payment: ${err.message}`);
        recordError(err.message, err.body || err.stack);
      }
    } else if (currentStep === 'ADMIN_VERIFIED_PAYMENT') {
      try {
        log('--- STEP 4: Booking Cancellation Request ---');
        const bookingId = syncLog.data?.bookingId || currentBooking?.id;
        const storedToken = syncLog.data?.authToken || authToken;

        if (!bookingId) {
          throw new Error('Missing bookingId in sync log data');
        }

        log(`Submitting cancellation request for booking ${bookingId}`);
        const cancelRes = await apiRequest(`/bookings/${bookingId}/cancel`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${storedToken}`,
          },
          body: JSON.stringify({
            reason: 'Pilgrim emergency medical schedule conflict - cancellation request submitted via client portal',
          }),
        });

        log('Cancellation submitted successfully');

        updateSyncLogStep(
          'CANCEL_REQUESTED',
          {
            cancellationReason: 'Pilgrim emergency medical schedule conflict',
          },
          `Cancellation requested for booking #${bookingId}`
        );
      } catch (err) {
        log(`Error during cancellation: ${err.message}`);
        recordError(err.message, err.body || err.stack);
      }
    } else if (
      currentStep === 'BOOKING_CREATED' ||
      currentStep === 'PAYMENT_COMPLETED' ||
      currentStep === 'CANCEL_REQUESTED' ||
      currentStep === 'DONE' ||
      currentStep === 'COMPLETED'
    ) {
      log(`Waiting for next orchestration trigger (Current step: ${currentStep})...`);
    } else if (currentStep === 'CLIENT_ERROR') {
      log('Client error state reached. Pausing monitor.');
      break;
    }

    await sleep(3000);
  }
}

runClientFlow().catch((err) => {
  log(`Fatal error: ${err.message}`);
  recordError(err.message, err.stack);
});

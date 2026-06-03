const https = require('https');
const querystring = require('querystring');

exports.handler = async (event) => {
  const STORE_ID = 'first6a1582b563f40';
  const STORE_PASSWORD = 'first6a1582b563f40@ssl';
  const IS_SANDBOX = true;

  let body;
  try {
    body = typeof event.body === 'string'
      ? querystring.parse(event.body)
      : event.body;
  } catch (e) {
    return { statusCode: 400, body: 'Bad request' };
  }

  const { val_id, tran_id, status } = body;

  if (status !== 'VALID' && status !== 'VALIDATED') {
    return { statusCode: 200, body: 'Invalid payment' };
  }

  // Verify with SSLCommerz
  const apiHost = IS_SANDBOX ? 'sandbox.sslcommerz.com' : 'securepay.sslcommerz.com';
  const verifyPath = `/validator/api/validationserverAPI.php?val_id=${val_id}&store_id=${STORE_ID}&store_passwd=${STORE_PASSWORD}&format=json`;

  return new Promise((resolve) => {
    https.get({ hostname: apiHost, path: verifyPath }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.status === 'VALID') {
            // Payment verified — Firebase update করতে হবে client side থেকে
            console.log('Payment verified for:', tran_id);
          }
        } catch (e) { console.error('Verify error:', e); }
        resolve({ statusCode: 200, body: 'OK' });
      });
    }).on('error', () => resolve({ statusCode: 500, body: 'Error' }));
  });
};

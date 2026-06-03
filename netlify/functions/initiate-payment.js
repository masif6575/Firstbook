const https = require('https');
const querystring = require('querystring');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const STORE_ID = 'first6a1582b563f40';
  const STORE_PASSWORD = 'first6a1582b563f40@ssl';
  const IS_SANDBOX = true; // sandbox mode — live করতে false করো

  let body;
  try {
    body = JSON.parse(event.body);
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request body' }) };
  }

  const { turfName, turfAddr, date, timeSlot, phone, advance, total, refCode, turfId } = body;

  const siteUrl = 'https://firstbookcumilla.netlify.app';

  const postData = querystring.stringify({
    store_id: STORE_ID,
    store_passwd: STORE_PASSWORD,
    total_amount: advance,
    currency: 'BDT',
    tran_id: refCode,
    success_url: `${siteUrl}/success.html?ref=${refCode}`,
    fail_url: `${siteUrl}/fail.html?ref=${refCode}`,
    cancel_url: `${siteUrl}/index.html`,
    ipn_url: `${siteUrl}/.netlify/functions/ipn`,
    cus_name: 'Customer',
    cus_email: 'customer@firstbook.com',
    cus_add1: turfAddr,
    cus_city: 'Cumilla',
    cus_country: 'Bangladesh',
    cus_phone: phone || '01700000000',
    product_name: `${turfName} - ${date} ${timeSlot}`,
    product_category: 'Sports',
    product_profile: 'non-physical-goods',
    shipping_method: 'NO',
    num_of_item: 1,
    value_a: turfId,
    value_b: date,
    value_c: timeSlot,
    value_d: refCode,
  });

  const apiHost = IS_SANDBOX
    ? 'sandbox.sslcommerz.com'
    : 'securepay.sslcommerz.com';

  return new Promise((resolve) => {
    const options = {
      hostname: apiHost,
      path: '/gwprocess/v4/api.php',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.status === 'SUCCESS') {
            resolve({
              statusCode: 200,
              headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
              body: JSON.stringify({ url: parsed.GatewayPageURL, sessionkey: parsed.sessionkey }),
            });
          } else {
            resolve({
              statusCode: 400,
              headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
              body: JSON.stringify({ error: parsed.failedreason || 'SSLCommerz error' }),
            });
          }
        } catch (e) {
          resolve({
            statusCode: 500,
            headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Parse error: ' + data }),
          });
        }
      });
    });

    req.on('error', (e) => {
      resolve({
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: e.message }),
      });
    });

    req.write(postData);
    req.end();
  });
};

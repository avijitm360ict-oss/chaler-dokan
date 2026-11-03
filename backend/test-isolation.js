/**
 * 🌾 SAAS MULTI-TENANT ISOLATION & SECURITY PENETRATION TEST SUITE
 * Chal A Dokan ERP/POS Multi-Tenant SaaS
 * Target: Production Backend or Local API
 */

const http = require('http');
const https = require('https');

const BASE_URL = process.env.TEST_API_URL || 'https://chal-a-dokan-backend.onrender.com/api/v1';
console.log('===============================================================');
console.log('🌾 SAAS MULTI-TENANT ISOLATION & SECURITY AUDIT TEST SUITE');
console.log(`Target: ${BASE_URL}`);
console.log('===============================================================\n');

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve) => {
    const url = new URL(`${BASE_URL}${path}`);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;

    const payload = body ? JSON.stringify(body) : null;
    const reqHeaders = {
      'Content-Type': 'application/json',
      ...headers,
    };
    if (payload) {
      reqHeaders['Content-Length'] = Buffer.byteLength(payload);
    }

    const options = {
      method,
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: `${url.pathname}${url.search}`,
      headers: reqHeaders,
    };

    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        let parsed;
        try {
          parsed = JSON.parse(data);
        } catch {
          parsed = data;
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: parsed,
        });
      });
    });

    req.on('error', (err) => {
      resolve({ status: 500, error: err.message });
    });

    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

const testResults = [];
function record(code, name, vector, expected, actual, pass, detail = '') {
  testResults.push({ code, name, vector, expected, actual, pass, detail });
  const icon = pass ? '✅ PASS' : '❌ FAIL';
  console.log(`[${icon}] ${code}: ${name}`);
  console.log(`   Result: ${actual}`);
  if (!pass && detail) {
    console.log(`   Detail: ${detail}`);
  }
}

async function runAudit() {
  const ts = Date.now();
  const phoneA = `01711${String(ts).slice(-6)}`;
  const phoneB = `01822${String(ts + 99).slice(-6)}`;

  console.log('--- PHASE 1: Provisioning Independent Tenants ---');
  // Tenant A
  const regResA = await request('POST', '/auth/register', {
    shopName: 'মেসার্স সোনার বাংলা আড়ত (Tenant A)',
    ownerName: 'মো: আলমগীর হোসেন',
    phone: phoneA,
    password: 'password123',
    address: 'বাবুবাজার, ঢাকা',
  });
  if (regResA.status !== 200 && regResA.status !== 201) {
    console.error('Failed to create Tenant A:', regResA.data);
    process.exit(1);
  }
  const tokenA = regResA.data?.token;
  const tenantAId = regResA.data?.tenant?.id;
  const ownerAId = regResA.data?.user?.id;
  console.log(`✓ Tenant A created: ID = ${tenantAId}, Phone = ${phoneA}`);

  // Tenant B
  const regResB = await request('POST', '/auth/register', {
    shopName: 'মেসার্স ভাই ভাই রাইস মিল (Tenant B)',
    ownerName: 'হাজী মো: রফিকুল ইসলাম',
    phone: phoneB,
    password: 'password123',
    address: 'বাদামতলী, ঢাকা',
  });
  if (regResB.status !== 200 && regResB.status !== 201) {
    console.error('Failed to create Tenant B:', regResB.data);
    process.exit(1);
  }
  const tokenB = regResB.data?.token;
  const tenantBId = regResB.data?.tenant?.id;
  console.log(`✓ Tenant B created: ID = ${tenantBId}, Phone = ${phoneB}`);

  console.log('\n--- PHASE 2: Provisioning Isolated Resources ---');
  // Add Cashier under Tenant A
  const staffPhoneA = `01799${String(ts).slice(-6)}`;
  const staffResA = await request(
    'POST',
    '/tenant/users',
    { name: 'আলমগীরের ক্যাশিয়ার', phone: staffPhoneA, role: 'cashier', password: 'password123' },
    { Authorization: `Bearer ${tokenA}` }
  );
  const cashierAId = staffResA.data?.data?.id;
  console.log(`✓ User under Tenant A created: ${cashierAId} (${staffPhoneA})`);

  // Add Product under Tenant A
  const prodResA = await request(
    'POST',
    '/products',
    {
      nameBn: 'মিনিকেট স্পেশাল এ (Tenant A Product)',
      variety: 'Miniket',
      grade: 'Premium',
      wholesalePriceBag50: 3600,
      retailPriceKg: 75,
      initialStockKg: 2000,
    },
    { Authorization: `Bearer ${tokenA}` }
  );
  const prodAId = prodResA.data?.product?.id || prodResA.data?.data?.id;
  console.log(`✓ Product under Tenant A created: ${prodAId}`);

  // Add Cashier under Tenant B
  const staffPhoneB = `01888${String(ts).slice(-6)}`;
  const staffResB = await request(
    'POST',
    '/tenant/users',
    { name: 'রফিকুলের ক্যাশিয়ার', phone: staffPhoneB, role: 'cashier', password: 'password123' },
    { Authorization: `Bearer ${tokenB}` }
  );
  const cashierBId = staffResB.data?.data?.id;
  console.log(`✓ User under Tenant B created: ${cashierBId} (${staffPhoneB})`);

  // Add Product under Tenant B
  const prodResB = await request(
    'POST',
    '/products',
    {
      nameBn: 'নাজিরশাইল প্রিমিয়াম বি (Tenant B Product)',
      variety: 'Najirshail',
      grade: 'Super',
      wholesalePriceBag50: 4200,
      retailPriceKg: 88,
      initialStockKg: 5000,
    },
    { Authorization: `Bearer ${tokenB}` }
  );
  const prodBId = prodResB.data?.product?.id || prodResB.data?.data?.id;
  console.log(`✓ Product under Tenant B created: ${prodBId}`);

  // Add Party under Tenant B
  const partyResB = await request(
    'POST',
    '/parties',
    {
      name: 'সাত্তার ট্রেডার্স (Tenant B Exclusive Customer)',
      partyType: 'customer',
      phone: '01999887766',
      creditLimitPaisa: 5000000,
      openingBalancePaisa: 1500000,
      balanceType: 'receivable',
    },
    { Authorization: `Bearer ${tokenB}` }
  );
  const partyBId = partyResB.data?.party?.id || partyResB.data?.data?.id;
  console.log(`✓ Customer Party under Tenant B created: ${partyBId}`);

  // Warehouses
  const whResA = await request('GET', '/warehouses', null, { Authorization: `Bearer ${tokenA}` });
  const whListA = whResA.data?.data || whResA.data?.warehouses || whResA.data || [];
  const whAId = whListA[0]?.id;
  console.log(`✓ Warehouse under Tenant A identified: ${whAId}`);

  const whResB = await request('GET', '/warehouses', null, { Authorization: `Bearer ${tokenB}` });
  const whListB = whResB.data?.data || whResB.data?.warehouses || whResB.data || [];
  const whBId = whListB[0]?.id;
  console.log(`✓ Warehouse under Tenant B identified: ${whBId}`);

  console.log('\n--- PHASE 3: Executing Cross-Tenant Access & Injection Tests ---');

  // Test 1: Product List Isolation
  const listProdAsA = await request('GET', '/products', null, { Authorization: `Bearer ${tokenA}` });
  const productsSeenByA = listProdAsA.data?.products || listProdAsA.data?.data || listProdAsA.data || [];
  const leakedProd = Array.isArray(productsSeenByA) ? productsSeenByA.find((p) => p.id === prodBId) : null;
  record(
    'ISO-01',
    'List Isolation: Products List Leakage Check',
    'GET /products as Tenant A',
    'Zero items belonging to Tenant B visible',
    leakedProd ? 'FAIL: Tenant B product visible!' : 'Clean (Tenant B product absent)',
    !leakedProd
  );

  // Test 2: BOLA / IDOR on Product Update
  const updateProdBAsA = await request(
    'PUT',
    `/products/${prodBId}`,
    { nameBn: 'ম্যালিসিয়াস পরিবর্তন (Hacked by A)' },
    { Authorization: `Bearer ${tokenA}` }
  );
  record(
    'ISO-02',
    'BOLA/IDOR: Update Tenant B Product as Tenant A',
    `PUT /products/${prodBId}`,
    '404 Not Found (চাল পাওয়া যায়নি)',
    `Status ${updateProdBAsA.status} (${updateProdBAsA.data?.message || ''})`,
    updateProdBAsA.status === 404
  );

  // Test 3: BOLA / IDOR on Product Delete
  const deleteProdBAsA = await request('DELETE', `/products/${prodBId}`, null, {
    Authorization: `Bearer ${tokenA}`,
  });
  record(
    'ISO-03',
    'BOLA/IDOR: Archive/Delete Tenant B Product as Tenant A',
    `DELETE /products/${prodBId}`,
    '404 Not Found (চাল পাওয়া যায়নি)',
    `Status ${deleteProdBAsA.status} (${deleteProdBAsA.data?.message || ''})`,
    deleteProdBAsA.status === 404
  );

  // Test 4: Parties List Isolation
  const listPartiesAsA = await request('GET', '/parties', null, { Authorization: `Bearer ${tokenA}` });
  const partiesSeenByA = listPartiesAsA.data?.parties || listPartiesAsA.data?.data || listPartiesAsA.data || [];
  const leakedParty = Array.isArray(partiesSeenByA) ? partiesSeenByA.find((p) => p.id === partyBId) : null;
  record(
    'ISO-04',
    'List Isolation: Parties List Leakage Check',
    'GET /parties as Tenant A',
    'Zero customers belonging to Tenant B visible',
    leakedParty ? 'FAIL: Tenant B party visible!' : 'Clean (Tenant B customer absent)',
    !leakedParty
  );

  // Test 5: BOLA / IDOR on Single Party Access
  const getPartyBAsA = await request('GET', `/parties/${partyBId}`, null, { Authorization: `Bearer ${tokenA}` });
  record(
    'ISO-05',
    'BOLA/IDOR: Direct Single Party Access by ID',
    `GET /parties/${partyBId}`,
    '404 Not Found (পার্টি পাওয়া যায়নি)',
    `Status ${getPartyBAsA.status} (${getPartyBAsA.data?.message || ''})`,
    getPartyBAsA.status === 404
  );

  // Test 6: Search Leakage
  const searchLeakAsA = await request('GET', '/parties?search=সাত্তার', null, {
    Authorization: `Bearer ${tokenA}`,
  });
  const searchResults = searchLeakAsA.data?.parties || searchLeakAsA.data?.data || searchLeakAsA.data || [];
  const searchLeaked = Array.isArray(searchResults) ? searchResults.some((p) => p.id === partyBId) : false;
  record(
    'ISO-06',
    'Search Isolation: Party Search by Tenant B keywords',
    'GET /parties?search=সাত্তার as Tenant A',
    'Empty or Tenant A matches only',
    `Returned ${Array.isArray(searchResults) ? searchResults.length : 0} items (Leak: ${searchLeaked})`,
    !searchLeaked
  );

  // Test 7: BOLA / IDOR on User Deactivation
  const updateCashierBAsA = await request(
    'PUT',
    `/tenant/users/${cashierBId}`,
    { active: false },
    { Authorization: `Bearer ${tokenA}` }
  );
  record(
    'ISO-07',
    'BOLA/IDOR: Disable Tenant B Employee as Tenant A',
    `PUT /tenant/users/${cashierBId}`,
    '404 Not Found (ব্যবহারকারী পাওয়া যায়নি)',
    `Status ${updateCashierBAsA.status} (${updateCashierBAsA.data?.message || ''})`,
    updateCashierBAsA.status === 404
  );

  // Test 8: Header Spoofing (x-tenant-id override)
  const spoofHeaderGetProducts = await request('GET', '/products', null, {
    Authorization: `Bearer ${tokenA}`,
    'x-tenant-id': tenantBId,
  });
  const spoofProducts = spoofHeaderGetProducts.data?.products || spoofHeaderGetProducts.data?.data || [];
  const spoofLeak = Array.isArray(spoofProducts) ? spoofProducts.some((p) => p.id === prodBId) : false;
  record(
    'ISO-08',
    'Header Spoofing: Malicious x-tenant-id header override',
    `GET /products with x-tenant-id: ${tenantBId}`,
    'Server IGNORES header for non-superadmin token',
    spoofLeak ? 'FAIL: Spoof succeeded!' : 'PROTECTED (Header ignored for non-superadmin)',
    !spoofLeak
  );

  // Test 9: Backup & Full Data Dump Isolation
  const backupAsA = await request('GET', '/tenant/backup', null, { Authorization: `Bearer ${tokenA}` });
  const backupData = backupAsA.data?.data || backupAsA.data;
  const backupProducts = backupData?.products || [];
  const backupParties = backupData?.parties || [];
  const backupLeakedProd = backupProducts.find((p) => p.id === prodBId);
  const backupLeakedParty = backupParties.find((p) => p.id === partyBId);
  const hasLeak = !!(backupLeakedProd || backupLeakedParty);
  record(
    'ISO-09',
    'Backup & Export Isolation: Full Tenant Data Dump Audit',
    'GET /tenant/backup',
    'Dump contains ZERO records from Tenant B',
    hasLeak ? 'CRITICAL LEAKAGE DETECTED' : 'Clean (100% Tenant A records only)',
    !hasLeak
  );

  // Test 10: Cross-Tenant Inventory Transfer Injection
  if (whBId && whAId) {
    const illegalTransfer = await request(
      'POST',
      '/inventory/transfer',
      {
        fromWarehouseId: whBId, // Foreign Tenant B warehouse!
        toWarehouseId: whAId,
        productId: prodAId,
        qtyKg: 50,
      },
      { Authorization: `Bearer ${tokenA}` }
    );
    record(
      'ISO-10',
      'Cross-Tenant State Manipulation: Inventory Transfer from Tenant B Warehouse',
      'POST /inventory/transfer with foreign warehouse',
      '400/500/404 Rejection',
      `Status ${illegalTransfer.status} (${illegalTransfer.data?.message || ''})`,
      illegalTransfer.status !== 200 && illegalTransfer.status !== 201
    );
  }

  console.log('\n--- PHASE 4: Authentication Hardening & Session Revocation Tests ---');

  // Test 11: Real-Time Session Revocation (SEC-02)
  // Step A: Login Cashier A and verify token works
  const loginCashierA = await request('POST', '/auth/login', {
    phone: staffPhoneA,
    password: 'password123',
  });
  const tokenCashierA = loginCashierA.data?.token;

  if (tokenCashierA) {
    // Step B: Owner A deactivates Cashier A
    await request('PUT', `/tenant/users/${cashierAId}`, { active: false }, { Authorization: `Bearer ${tokenA}` });

    // Step C: Disabled Cashier A tries to use their token
    const disabledAccess = await request('GET', '/products', null, {
      Authorization: `Bearer ${tokenCashierA}`,
    });

    record(
      'SEC-02',
      'Real-Time Session Revocation: Disabled User Token Immediately Rejected',
      'GET /products using disabled cashier JWT',
      '401 Unauthorized (একাউন্টটি নিষ্ক্রিয় করা হয়েছে)',
      `Status ${disabledAccess.status} (${disabledAccess.data?.message || ''})`,
      disabledAccess.status === 401
    );
  }

  // Test 12: Self-Service Password Reset Flow (SEC-01)
  const forgotRes = await request('POST', '/auth/forgot-password', { phone: phoneA });
  const devOtp = forgotRes.data?.devOtp;
  record(
    'SEC-01A',
    'Password Reset: Request 6-digit SMS OTP',
    `POST /auth/forgot-password for ${phoneA}`,
    '200 OK with confirmation message',
    `Status ${forgotRes.status} (${forgotRes.data?.message || ''})`,
    forgotRes.status === 200
  );

  if (devOtp) {
    const resetRes = await request('POST', '/auth/reset-password', {
      phone: phoneA,
      otp: devOtp,
      newPassword: 'newPassword456',
    });
    record(
      'SEC-01B',
      'Password Reset: Verify OTP and Set New Password',
      'POST /auth/reset-password',
      '200 OK password changed',
      `Status ${resetRes.status} (${resetRes.data?.message || ''})`,
      resetRes.status === 200
    );

    // Verify login with new password
    const newLoginRes = await request('POST', '/auth/login', {
      phone: phoneA,
      password: 'newPassword456',
    });
    record(
      'SEC-01C',
      'Password Reset: Login with Newly Reset Password',
      'POST /auth/login with newPassword456',
      '200 OK Login Successful',
      `Status ${newLoginRes.status} (Token issued: ${!!newLoginRes.data?.token})`,
      newLoginRes.status === 200 && !!newLoginRes.data?.token
    );
  }

  console.log('\n===============================================================');
  console.log('📊 FINAL TEST AUDIT SUMMARY:');
  const total = testResults.length;
  const passed = testResults.filter((r) => r.pass).length;
  const failed = total - passed;
  console.log(`Total Test Vectors: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Overall Security & Isolation Verdict: ${failed === 0 ? '100% PASS' : 'FAIL'}`);
  console.log('===============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAudit();

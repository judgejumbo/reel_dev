#!/usr/bin/env node

/**
 * Test script for webhook security
 * Tests HMAC signature verification and rate limiting
 */

const crypto = require('crypto')

const WEBHOOK_URL = 'http://localhost:3000/api/webhook/complete'
const WEBHOOK_SECRET = 'reeldev_webhook_secret_2024_secure_key_for_n8n_integration'

function generateSignature(payload, timestamp) {
  const signaturePayload = `${timestamp}.${payload}`
  return crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(signaturePayload, 'utf8')
    .digest('hex')
}

async function testWebhook(testName, options = {}) {
  console.log(`\n🧪 Testing: ${testName}`)

  const testPayload = {
    jobId: 'test-job-' + Date.now(),
    status: 'completed',
    resultUrl: 'https://example.com/result.mp4'
  }

  const payload = JSON.stringify(testPayload)
  const timestamp = Date.now().toString()
  const signature = options.invalidSignature
    ? 'invalid-signature'
    : generateSignature(payload, timestamp)

  const headers = {
    'Content-Type': 'application/json',
    ...(options.includeSignature !== false && {
      'x-n8n-signature': signature,
      'x-timestamp': timestamp
    })
  }

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers,
      body: payload
    })

    const result = await response.text()
    console.log(`Status: ${response.status}`)
    console.log(`Response: ${result}`)

    return response.status
  } catch (error) {
    console.error(`❌ Error: ${error.message}`)
    return null
  }
}

async function runTests() {
  console.log('🚀 Starting Webhook Security Tests')
  console.log(`Testing endpoint: ${WEBHOOK_URL}`)

  // Test 1: Valid signature
  await testWebhook('Valid HMAC signature', {})

  // Test 2: Missing signature
  await testWebhook('Missing signature headers', { includeSignature: false })

  // Test 3: Invalid signature
  await testWebhook('Invalid signature', { invalidSignature: true })

  // Test 4: Rate limiting (multiple requests)
  console.log('\n🧪 Testing: Rate limiting (6 requests in quick succession)')
  for (let i = 1; i <= 6; i++) {
    const status = await testWebhook(`Rate limit test ${i}`, {})
    if (status === 429) {
      console.log(`✅ Rate limiting works! Request ${i} was blocked.`)
      break
    }
    await new Promise(resolve => setTimeout(resolve, 100)) // Small delay
  }

  console.log('\n✅ Webhook security tests completed!')
  console.log('\nExpected results:')
  console.log('- Valid signature: 200 or 404 (job not found is OK)')
  console.log('- Missing signature: 401 (Unauthorized)')
  console.log('- Invalid signature: 401 (Unauthorized)')
  console.log('- Rate limiting: 429 (Too Many Requests) after 5 requests')
}

// Run the tests
runTests().catch(console.error)
#!/usr/bin/env node

/**
 * Test script for video proxy endpoint security
 * Tests authentication requirements
 */

const VIDEO_PROXY_URL = 'http://localhost:3000/api/videos/proxy'

async function testVideoProxy(testName, options = {}) {
  console.log(`\n🧪 Testing: ${testName}`)

  const testUrl = 'https://example.r2.cloudflarestorage.com/test-video.mp4'
  const url = `${VIDEO_PROXY_URL}?url=${encodeURIComponent(testUrl)}`

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  }

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers
    })

    const result = await response.text()
    console.log(`Status: ${response.status}`)
    console.log(`Response: ${result.substring(0, 200)}${result.length > 200 ? '...' : ''}`)

    return response.status
  } catch (error) {
    console.error(`❌ Error: ${error.message}`)
    return null
  }
}

async function runVideoProxyTests() {
  console.log('🚀 Starting Video Proxy Security Tests')
  console.log(`Testing endpoint: ${VIDEO_PROXY_URL}`)

  // Test 1: Unauthenticated request (should fail)
  await testVideoProxy('Unauthenticated request', {})

  // Test 2: Missing URL parameter
  const noUrlEndpoint = VIDEO_PROXY_URL
  console.log(`\n🧪 Testing: Missing URL parameter`)
  try {
    const response = await fetch(noUrlEndpoint, { method: 'GET' })
    const result = await response.text()
    console.log(`Status: ${response.status}`)
    console.log(`Response: ${result}`)
  } catch (error) {
    console.error(`❌ Error: ${error.message}`)
  }

  console.log('\n✅ Video Proxy security tests completed!')
  console.log('\nExpected results:')
  console.log('- Unauthenticated request: 401 (Unauthorized)')
  console.log('- Missing URL parameter: 401 (Unauthorized - auth check happens first)')
  console.log('\nNote: To test authenticated requests, you would need a valid session cookie.')
}

// Run the tests
runVideoProxyTests().catch(console.error)
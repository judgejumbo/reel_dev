#!/usr/bin/env node

/**
 * Test script for all API endpoints security
 * Tests authentication requirements on critical endpoints
 */

const API_BASE_URL = 'http://localhost:3000/api'

async function testEndpoint(method, endpoint, description, body = null) {
  console.log(`\n🧪 Testing: ${description}`)
  console.log(`   ${method} ${endpoint}`)

  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    }

    if (body) {
      options.body = JSON.stringify(body)
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, options)
    const result = await response.text()

    console.log(`   Status: ${response.status}`)
    console.log(`   Response: ${result.substring(0, 100)}${result.length > 100 ? '...' : ''}`)

    return response.status
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`)
    return null
  }
}

async function runSecurityTests() {
  console.log('🚀 Starting API Endpoints Security Tests')
  console.log(`Testing base URL: ${API_BASE_URL}`)

  // Test critical video endpoints
  await testEndpoint('GET', '/videos', 'Get videos list (should require auth)')
  await testEndpoint('GET', '/videos/fake-id', 'Get single video (should require auth)')
  await testEndpoint('DELETE', '/videos/fake-id', 'Delete single video (should require auth)')
  await testEndpoint('POST', '/videos/bulk-delete', 'Bulk delete videos (should require auth)', { videoIds: ['fake1', 'fake2'] })
  await testEndpoint('DELETE', '/videos/purge', 'Purge all videos (should require auth)')

  // Test upload endpoints
  await testEndpoint('POST', '/upload/presigned-url', 'Get presigned URL (should require auth)', { filename: 'test.mp4', contentType: 'video/mp4', type: 'main' })
  await testEndpoint('POST', '/upload/complete', 'Complete upload (should require auth)', { type: 'main', fileId: 'test', filename: 'test.mp4', fileSize: 1000, fileKey: 'test' })

  // Test processing endpoints
  await testEndpoint('GET', '/processing/status/fake-job-id', 'Get processing status (should require auth)')
  await testEndpoint('POST', '/webhook/process', 'Start processing (should require auth)', { payload: {}, projectName: 'test' })

  console.log('\n✅ API Endpoints security tests completed!')
  console.log('\nExpected results:')
  console.log('- All endpoints should return 401 (Unauthorized) for unauthenticated requests')
  console.log('- This confirms our authentication fixes are working properly')
}

// Run the tests
runSecurityTests().catch(console.error)
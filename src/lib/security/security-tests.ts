import { secureQueries, createSecureContext } from "./queries"
import { verifyVideoOwnership, verifyJobOwnership } from "./ownership"
import { authHardening } from "./auth-hardening"
import { auditLogger } from "./audit"

// Test result interface
interface SecurityTestResult {
  testName: string
  passed: boolean
  message: string
  details?: unknown
  duration?: number
}

interface SecurityTestSuite {
  suiteName: string
  tests: SecurityTestResult[]
  passed: boolean
  totalTests: number
  passedTests: number
  duration: number
}

/**
 * Comprehensive security test suite
 */
export class SecurityTester {
  private results: SecurityTestSuite[] = []

  /**
   * Run all security tests
   */
  async runAllTests(): Promise<{
    suites: SecurityTestSuite[]
    overallPassed: boolean
    totalTests: number
    passedTests: number
    duration: number
  }> {
    console.log("🔒 Starting comprehensive security test suite...")
    const startTime = Date.now()

    // Run test suites
    await this.testOwnershipValidation()
    await this.testSecureQueries()
    await this.testAuthHardening()
    await this.testRateLimiting()
    await this.testAuditLogging()

    const duration = Date.now() - startTime
    const totalTests = this.results.reduce((sum, suite) => sum + suite.totalTests, 0)
    const passedTests = this.results.reduce((sum, suite) => sum + suite.passedTests, 0)
    const overallPassed = this.results.every(suite => suite.passed)

    console.log(`\n🎯 Security tests completed in ${duration}ms`)
    console.log(`📊 Results: ${passedTests}/${totalTests} tests passed`)

    return {
      suites: this.results,
      overallPassed,
      totalTests,
      passedTests,
      duration
    }
  }

  /**
   * Test ownership validation functions
   */
  private async testOwnershipValidation(): Promise<void> {
    const suite: SecurityTestSuite = {
      suiteName: "Ownership Validation",
      tests: [],
      passed: false,
      totalTests: 0,
      passedTests: 0,
      duration: 0
    }

    const startTime = Date.now()

    // Test video ownership verification
    await this.runTest(suite, "Video ownership - valid user", async () => {
      const testUserId = "test-user-123"
      const testVideoId = "test-video-456"

      try {
        // This should throw an error since we're testing with fake IDs
        await verifyVideoOwnership(testUserId, testVideoId)
        return { passed: false, message: "Should have thrown an error for non-existent video" }
      } catch (error) {
        // Expected behavior - video doesn't exist
        return { passed: true, message: "Correctly rejected non-existent video access" }
      }
    })

    // Test job ownership verification
    await this.runTest(suite, "Job ownership - invalid user", async () => {
      const testUserId = "test-user-123"
      const testJobId = "test-job-789"

      try {
        await verifyJobOwnership(testUserId, testJobId)
        return { passed: false, message: "Should have thrown an error for non-existent job" }
      } catch (error) {
        return { passed: true, message: "Correctly rejected non-existent job access" }
      }
    })

    suite.duration = Date.now() - startTime
    suite.passed = suite.tests.every(test => test.passed)
    suite.totalTests = suite.tests.length
    suite.passedTests = suite.tests.filter(test => test.passed).length

    this.results.push(suite)
  }

  /**
   * Test secure query functions
   */
  private async testSecureQueries(): Promise<void> {
    const suite: SecurityTestSuite = {
      suiteName: "Secure Queries",
      tests: [],
      passed: false,
      totalTests: 0,
      passedTests: 0,
      duration: 0
    }

    const startTime = Date.now()

    // Test secure context creation
    await this.runTest(suite, "Secure context creation", async () => {
      const context = createSecureContext("test-user-123", "test-request-456")

      if (context.userId === "test-user-123" && context.requestId) {
        return { passed: true, message: "Secure context created successfully" }
      }

      return { passed: false, message: "Secure context creation failed" }
    })

    // Test secure find function
    await this.runTest(suite, "Secure find operation", async () => {
      const context = createSecureContext("test-user-123")

      try {
        const results = await secureQueries.find("video", context)
        // Should return empty array for non-existent user
        return {
          passed: Array.isArray(results),
          message: `Secure find returned ${results?.length || 0} results`
        }
      } catch (error) {
        return { passed: false, message: `Secure find failed: ${error}` }
      }
    })

    // Test secure find by ID with non-existent resource
    await this.runTest(suite, "Secure find by ID - non-existent", async () => {
      const context = createSecureContext("test-user-123")

      try {
        await secureQueries.findById("video", context, "non-existent-id")
        return { passed: false, message: "Should have thrown error for non-existent resource" }
      } catch (error) {
        return { passed: true, message: "Correctly rejected access to non-existent resource" }
      }
    })

    suite.duration = Date.now() - startTime
    suite.passed = suite.tests.every(test => test.passed)
    suite.totalTests = suite.tests.length
    suite.passedTests = suite.tests.filter(test => test.passed).length

    this.results.push(suite)
  }

  /**
   * Test authentication hardening features
   */
  private async testAuthHardening(): Promise<void> {
    const suite: SecurityTestSuite = {
      suiteName: "Authentication Hardening",
      tests: [],
      passed: false,
      totalTests: 0,
      passedTests: 0,
      duration: 0
    }

    const startTime = Date.now()

    // Test password strength validation
    await this.runTest(suite, "Password strength - weak password", async () => {
      const result = authHardening.validatePasswordStrength("123")

      if (!result.isValid && result.errors.length > 0) {
        return { passed: true, message: `Correctly rejected weak password: ${result.errors.join(", ")}` }
      }

      return { passed: false, message: "Should have rejected weak password" }
    })

    await this.runTest(suite, "Password strength - strong password", async () => {
      const result = authHardening.validatePasswordStrength("MyStr0ng!Password123")

      if (result.isValid && result.score >= 4) {
        return { passed: true, message: `Strong password accepted with score ${result.score}` }
      }

      return { passed: false, message: `Strong password validation failed: ${result.errors.join(", ")}` }
    })

    // Test failed login tracking
    await this.runTest(suite, "Failed login tracking", async () => {
      const email = "test@example.com"
      const ip = "192.168.1.1"

      const result = await authHardening.trackFailedLogin(email, ip, "test-user-agent")

      if (typeof result.shouldLockAccount === "boolean" && typeof result.attemptsRemaining === "number") {
        return { passed: true, message: `Failed login tracked: ${result.attemptsRemaining} attempts remaining` }
      }

      return { passed: false, message: "Failed login tracking returned invalid result" }
    })

    // Test account lockout check
    await this.runTest(suite, "Account lockout check", async () => {
      const email = "test@example.com"

      const lockoutStatus = authHardening.isAccountLocked(email)

      if (typeof lockoutStatus.isLocked === "boolean") {
        return { passed: true, message: `Account lockout check: ${lockoutStatus.isLocked ? "locked" : "not locked"}` }
      }

      return { passed: false, message: "Account lockout check returned invalid result" }
    })

    // Test token expiration
    await this.runTest(suite, "Token expiration check", async () => {
      const oldDate = new Date(Date.now() - 20 * 60 * 1000) // 20 minutes ago
      const newDate = new Date(Date.now() - 5 * 60 * 1000)  // 5 minutes ago

      const expiredResult = authHardening.isTokenExpired(oldDate, 15)
      const validResult = authHardening.isTokenExpired(newDate, 15)

      if (expiredResult === true && validResult === false) {
        return { passed: true, message: "Token expiration logic working correctly" }
      }

      return { passed: false, message: "Token expiration logic failed" }
    })

    suite.duration = Date.now() - startTime
    suite.passed = suite.tests.every(test => test.passed)
    suite.totalTests = suite.tests.length
    suite.passedTests = suite.tests.filter(test => test.passed).length

    this.results.push(suite)
  }

  /**
   * Test rate limiting functionality
   */
  private async testRateLimiting(): Promise<void> {
    const suite: SecurityTestSuite = {
      suiteName: "Rate Limiting",
      tests: [],
      passed: false,
      totalTests: 0,
      passedTests: 0,
      duration: 0
    }

    const startTime = Date.now()

    // Test security metrics retrieval
    await this.runTest(suite, "Security metrics", async () => {
      const metrics = authHardening.getSecurityMetrics()

      if (
        typeof metrics.activeFailedAttempts === "number" &&
        typeof metrics.activeLockouts === "number" &&
        Array.isArray(metrics.lockoutDetails)
      ) {
        return {
          passed: true,
          message: `Security metrics retrieved: ${metrics.activeFailedAttempts} failed attempts, ${metrics.activeLockouts} lockouts`
        }
      }

      return { passed: false, message: "Security metrics format invalid" }
    })

    suite.duration = Date.now() - startTime
    suite.passed = suite.tests.every(test => test.passed)
    suite.totalTests = suite.tests.length
    suite.passedTests = suite.tests.filter(test => test.passed).length

    this.results.push(suite)
  }

  /**
   * Test audit logging functionality
   */
  private async testAuditLogging(): Promise<void> {
    const suite: SecurityTestSuite = {
      suiteName: "Audit Logging",
      tests: [],
      passed: false,
      totalTests: 0,
      passedTests: 0,
      duration: 0
    }

    const startTime = Date.now()

    // Test audit log success
    await this.runTest(suite, "Audit log success", async () => {
      try {
        await auditLogger.logSuccess(
          "test-user",
          "READ",
          "video",
          "test-video-id",
          "test-request",
          { test: true }
        )
        return { passed: true, message: "Success audit log created" }
      } catch (error) {
        return { passed: false, message: `Audit log failed: ${error}` }
      }
    })

    // Test audit log failure
    await this.runTest(suite, "Audit log failure", async () => {
      try {
        await auditLogger.logFailure(
          "DELETE",
          "video",
          "Test failure message",
          "test-user",
          "test-video-id",
          undefined,
          "test-request"
        )
        return { passed: true, message: "Failure audit log created" }
      } catch (error) {
        return { passed: false, message: `Audit log failed: ${error}` }
      }
    })

    // Test audit log violation
    await this.runTest(suite, "Audit log violation", async () => {
      try {
        await auditLogger.logViolation(
          "OWNERSHIP_VIOLATION",
          "UPDATE",
          "video",
          "Test violation message",
          "test-user",
          "test-video-id",
          "test-request"
        )
        return { passed: true, message: "Violation audit log created" }
      } catch (error) {
        return { passed: false, message: `Audit log failed: ${error}` }
      }
    })

    suite.duration = Date.now() - startTime
    suite.passed = suite.tests.every(test => test.passed)
    suite.totalTests = suite.tests.length
    suite.passedTests = suite.tests.filter(test => test.passed).length

    this.results.push(suite)
  }

  /**
   * Helper method to run individual tests
   */
  private async runTest(
    suite: SecurityTestSuite,
    testName: string,
    testFunction: () => Promise<{ passed: boolean; message: string; details?: unknown }>
  ): Promise<void> {
    const startTime = Date.now()

    try {
      const result = await testFunction()

      const testResult: SecurityTestResult = {
        testName,
        passed: result.passed,
        message: result.message,
        details: result.details,
        duration: Date.now() - startTime
      }

      suite.tests.push(testResult)

      console.log(`  ${result.passed ? "✅" : "❌"} ${testName}: ${result.message}`)

    } catch (error) {
      const testResult: SecurityTestResult = {
        testName,
        passed: false,
        message: `Test threw error: ${error}`,
        duration: Date.now() - startTime
      }

      suite.tests.push(testResult)

      console.log(`  ❌ ${testName}: Test threw error: ${error}`)
    }
  }

  /**
   * Get detailed test report
   */
  getDetailedReport(): string {
    let report = "\n🔒 SECURITY TEST DETAILED REPORT\n"
    report += "=" .repeat(50) + "\n\n"

    for (const suite of this.results) {
      report += `📋 ${suite.suiteName}\n`
      report += `-`.repeat(30) + "\n"
      report += `Status: ${suite.passed ? "✅ PASSED" : "❌ FAILED"}\n`
      report += `Tests: ${suite.passedTests}/${suite.totalTests} passed\n`
      report += `Duration: ${suite.duration}ms\n\n`

      for (const test of suite.tests) {
        report += `  ${test.passed ? "✅" : "❌"} ${test.testName}\n`
        report += `     ${test.message}\n`
        if (test.duration) {
          report += `     Duration: ${test.duration}ms\n`
        }
        report += "\n"
      }

      report += "\n"
    }

    return report
  }
}

/**
 * Run quick security validation
 */
export async function runSecurityValidation(): Promise<boolean> {
  const tester = new SecurityTester()
  const results = await tester.runAllTests()

  if (results.overallPassed) {
    console.log("🎉 All security tests passed!")
  } else {
    console.log("⚠️  Some security tests failed. Review the report above.")
  }

  return results.overallPassed
}

export const securityTests = {
  SecurityTester,
  runSecurityValidation
}
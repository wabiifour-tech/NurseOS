/**
 * Test HTTP client helpers for NurseOS integration tests.
 * All helpers point at the NEXTAUTH_URL (or http://localhost:3000 by default).
 */

const BASE_URL = process.env.NEXTAUTH_URL || process.env.APP_URL || 'http://localhost:3000';

export interface TestResponse {
  status: number;
  body: any;
  headers: Record<string, string>;
}

/**
 * Make an HTTP request and return status, parsed body, and select headers.
 */
export async function makeRequest(path: string, options: RequestInit = {}): Promise<TestResponse> {
  const url = path.startsWith('http') ? path : `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  const text = await res.text();
  let body: any;
  try { body = JSON.parse(text); } catch { body = text; }
  const headers: Record<string, string> = {};
  res.headers.forEach((v, k) => { headers[k] = v; });
  return { status: res.status, body, headers };
}

/**
 * Shorthand: call a route handler and expect a JSON response.
 */
export async function callRoute(path: string, options: RequestInit = {}): Promise<{ status: number; data: any }> {
  const res = await makeRequest(path, options);
  return { status: res.status, data: res.body };
}

/**
 * Register a test facility via the public API.
 * Returns the created facility object.
 */
export async function createTestFacility(data?: Record<string, unknown>) {
  const payload = {
    name: `Test Facility ${Date.now()}`,
    type: 'HOSPITAL',
    address: '123 Test St',
    city: 'Test City',
    state: 'Test State',
    country: 'Nigeria',
    ...data,
  };
  const res = await callRoute('/api/facilities/public', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res;
}

/**
 * Register a test user and return auth tokens.
 */
export async function createTestUser(data?: Record<string, unknown>) {
  const payload = {
    email: `testuser-${Date.now()}@example.com`,
    password: 'TestPass123!',
    firstName: 'Test',
    lastName: 'User',
    role: 'NURSE',
    ...data,
  };
  const res = await callRoute('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res;
}

/**
 * Log in a test user and return the token.
 */
export async function loginTestUser(email: string, password: string) {
  const res = await callRoute('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  return res;
}

/**
 * Create a test patient under a given facility.
 */
export async function createTestPatient(token: string, facilityId: string, data?: Record<string, unknown>) {
  const payload = {
    firstName: 'John',
    lastName: 'Doe',
    dateOfBirth: '1990-01-15',
    gender: 'MALE',
    ...data,
  };
  return callRoute(`/api/patients?facilityId=${facilityId}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

/**
 * Clean up test data by email prefix (best-effort, requires admin or test-only endpoint).
 */
export async function cleanupTestData(emailPrefix: string, token: string) {
  // Best-effort cleanup — the actual implementation depends on admin API availability
  try {
    await callRoute('/api/auth/test-cleanup', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ emailPrefix }),
    });
  } catch {
    // Cleanup endpoint may not exist in production
  }
}

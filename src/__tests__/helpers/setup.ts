/**
 * Vitest global setup — loads .env.local so DATABASE_URL is available in tests.
 * This file is referenced in vitest.config.ts under setupFiles.
 */
import 'dotenv/config';
process.env.NODE_ENV = 'test';

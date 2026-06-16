#!/bin/bash
# Start dev server, run email test, kill server
set -e

cd /home/z/my-project
unset DATABASE_URL
export DATABASE_URL="postgresql://neondb_owner:npg_RFQg1JTECq7U@ep-snowy-firefly-ap4ppwzh-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require"

echo "=== Starting Next.js dev server ==="
npx next dev -p 3000 > /tmp/next-dev.log 2>&1 &
NEXT_PID=$!
echo "Server PID: $NEXT_PID"

# Wait for server to be ready
echo "Waiting for server to be ready..."
for i in {1..30}; do
  if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health 2>/dev/null | grep -q "200"; then
    echo "✓ Server is ready (after ${i}s)"
    break
  fi
  sleep 1
done

# Verify server is up
HEALTH=$(curl -s http://localhost:3000/api/health)
echo "Health: $HEALTH"
echo ""

# Run the email test
echo "=== Running email send test ==="
export DATABASE_URL="postgresql://neondb_owner:npg_RFQg1JTECq7U@ep-snowy-firefly-ap4ppwzh-pooler.c-7.us-east-1.aws.neon.db?sslmode=require"
node scripts/test-email-send-api.js 2>&1
TEST_EXIT=$?

# Kill server
echo ""
echo "=== Stopping dev server ==="
kill $NEXT_PID 2>/dev/null || true
wait $NEXT_PID 2>/dev/null || true

exit $TEST_EXIT

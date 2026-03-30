#!/bin/bash
set -e

echo "🚀 Starting CRM Platform..."
echo ""

# Start Docker infrastructure
echo "Starting infrastructure (PostgreSQL, Redis, etc.)..."
docker-compose up -d --quiet-pull 2>/dev/null || docker compose up -d --quiet-pull 2>/dev/null
echo "  Infrastructure started"

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL..."
until docker exec crm-tool-postgres-1 pg_isready -U crm -d crm_dev -q 2>/dev/null; do
  sleep 1
done
echo "  PostgreSQL ready"

# Install deps if needed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  pnpm install
fi

# Check if tables exist, run migrations if not
TABLE_COUNT=$(docker exec crm-tool-postgres-1 psql -U crm -d crm_dev -t -A -c "SELECT count(*) FROM information_schema.tables WHERE table_schema='public'" 2>/dev/null)
if [ "$TABLE_COUNT" -lt "10" ]; then
  echo "Running database migrations..."
  pnpm db:migrate
  echo "Seeding demo data..."
  pnpm db:seed
fi

echo ""
echo "Starting API + Web servers..."
echo ""
echo "  Web UI:       http://localhost:3000"
echo "  API:          http://localhost:3001"
echo "  API Docs:     http://localhost:3001/api/docs"
echo "  Email Viewer: http://localhost:8025"
echo ""
echo "  Login:        admin@acme.com / Password123!"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Start both servers
pnpm dev

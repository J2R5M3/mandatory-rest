#!/bin/bash

# Setup colors
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo "🚀 Starting E2E test for mandatory.rest API"

echo -e "\n${GREEN}1. Creating a Session...${NC}"
curl -X POST http://localhost:8787/api/sessions \
     -H "Content-Type: application/json" \
     -d '{
       "id": "session-123",
       "title": "Dinner at Songs",
       "duration_mins": 120,
       "window_start": "2024-10-01T18:00:00Z",
       "window_end": "2024-10-01T22:00:00Z",
       "timer_deadline": "1970-01-01T00:00:00Z"
     }'

echo -e "\n\n${GREEN}2. Adding a Participant...${NC}"
curl -X POST http://localhost:8787/api/participants \
     -H "Content-Type: application/json" \
     -d '{
       "id": "participant-123",
       "session_id": "session-123",
       "email": "jules@example.com"
     }'

echo -e "\n\n${GREEN}3. Adding a Token...${NC}"
curl -X POST http://localhost:8787/api/tokens \
     -H "Content-Type: application/json" \
     -d '{
       "id": "token-123",
       "participant_id": "participant-123",
       "provider": "google",
       "refresh_token": "fake-encrypted-refresh-token",
       "is_primary": 1
     }'

echo -e "\n\n${GREEN}4. Triggering the Cron Engine...${NC}"
# Wait a second for DB ops to settle
sleep 1

curl "http://localhost:8787/__scheduled?cron=*+*+*+*+*"

echo -e "\n\n✅ Done! Check your wrangler logs."

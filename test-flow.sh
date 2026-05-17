#!/bin/bash

# Setup colors
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo "🚀 Starting E2E test for mandatory.rest API"

echo -e "\n${GREEN}1. Creating a Session...${NC}"
curl -X POST http://localhost:8787/api/sessions \
     -H "Content-Type: application/json" \
     -d "{
       \"id\": \"session-test-$(date +%s)\",
       \"title\": \"Dinner at Songs\",
       \"duration_mins\": 120,
       \"window_start\": \"2024-10-01T18:00:00Z\",
       \"window_end\": \"2024-10-01T22:00:00Z\",
       \"timer_deadline\": \"1970-01-01T00:00:00Z\",
       \"interval_days\": 14
     }"

SESSION_ID="session-test-$(date +%s)"

echo -e "\n\n${GREEN}2. Testing Lockin Route...${NC}"
# Use cookies and simulate a lockin post
curl -X POST http://localhost:8787/api/sessions/lockin \
     -H "Origin: http://localhost:8787" \
     -H "Referer: http://localhost:8787/s/$SESSION_ID" \
     -d "session_id=$SESSION_ID" \
     -c cookies.txt \
     -v

echo -e "\n\n${GREEN}3. Testing Auth Callback Route...${NC}"
# Pass mocked valid base64 state object
STATE=$(echo -n "{\"sessionId\":\"$SESSION_ID\",\"provider\":\"mock\",\"isPrimary\":1}" | base64)
curl -X GET "http://localhost:8787/api/auth/callback?code=mock_code&state=$STATE" -c cookies.txt -v

echo -e "\n\n${GREEN}4. Testing the Trap Participant Interface...${NC}"
curl -X GET "http://localhost:8787/s/$SESSION_ID" -b cookies.txt

echo -e "\n\n✅ Done! Check your wrangler logs."

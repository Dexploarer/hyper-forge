#!/bin/bash
# API Endpoint Testing Script
# Tests the fixed endpoints for prompts and content generation

set -e

API_URL="${API_URL:-https://hyperforge-production.up.railway.app}"
AUTH_TOKEN="${AUTH_TOKEN:-}"

echo "========================================="
echo "API Endpoint Testing"
echo "========================================="
echo "API URL: $API_URL"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

test_endpoint() {
    local name="$1"
    local method="$2"
    local endpoint="$3"
    local data="$4"
    local auth_required="$5"

    echo -e "${YELLOW}Testing: $name${NC}"
    echo "  Method: $method"
    echo "  Endpoint: $endpoint"

    # Build curl command
    local curl_cmd="curl -s -w '\nHTTP_STATUS:%{http_code}\n' -X $method"
    curl_cmd="$curl_cmd -H 'Content-Type: application/json'"

    if [ "$auth_required" = "true" ] && [ -n "$AUTH_TOKEN" ]; then
        curl_cmd="$curl_cmd -H 'Authorization: Bearer $AUTH_TOKEN'"
    fi

    if [ -n "$data" ]; then
        curl_cmd="$curl_cmd -d '$data'"
    fi

    curl_cmd="$curl_cmd '$API_URL$endpoint'"

    # Execute and parse response
    response=$(eval $curl_cmd)
    http_code=$(echo "$response" | grep "HTTP_STATUS:" | cut -d':' -f2)
    body=$(echo "$response" | grep -v "HTTP_STATUS:")

    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        echo -e "  ${GREEN}✓ SUCCESS${NC} (HTTP $http_code)"
        echo "  Response: ${body:0:200}..."
    elif [ "$http_code" -eq 401 ] || [ "$http_code" -eq 403 ]; then
        echo -e "  ${YELLOW}⚠ AUTH REQUIRED${NC} (HTTP $http_code)"
        echo "  Set AUTH_TOKEN environment variable to test authenticated endpoints"
    else
        echo -e "  ${RED}✗ FAILED${NC} (HTTP $http_code)"
        echo "  Response: $body"
    fi
    echo ""
}

echo "========================================="
echo "1. Health Check (Baseline)"
echo "========================================="
test_endpoint \
    "Health Check" \
    "GET" \
    "/api/health" \
    "" \
    "false"

echo "========================================="
echo "2. Prompts API Tests"
echo "========================================="

# Test getting system prompts (public endpoint)
test_endpoint \
    "Get NPC System Prompts" \
    "GET" \
    "/api/prompts/npc" \
    "" \
    "false"

# Test listing user prompts (requires auth)
test_endpoint \
    "List User Custom Prompts" \
    "GET" \
    "/api/prompts/custom/user/did:privy:test123" \
    "" \
    "true"

# Test creating custom prompt (requires auth)
test_endpoint \
    "Create Custom Prompt" \
    "POST" \
    "/api/prompts/custom" \
    '{
        "type": "npc",
        "name": "Test NPC Prompt",
        "content": {
            "prompt": "Generate a brave knight character",
            "archetype": "warrior"
        },
        "description": "Test prompt for API testing",
        "isPublic": false,
        "createdBy": "did:privy:test123"
    }' \
    "false"

echo "========================================="
echo "3. Content Generation API Tests"
echo "========================================="

# Test NPC generation (the problematic endpoint)
test_endpoint \
    "Generate NPC" \
    "POST" \
    "/api/content/generate-npc" \
    '{
        "prompt": "Create a mysterious wizard NPC",
        "archetype": "mage",
        "context": "A wise wizard who guards ancient knowledge",
        "quality": "balanced"
    }' \
    "false"

# Test Quest generation
test_endpoint \
    "Generate Quest" \
    "POST" \
    "/api/content/generate-quest" \
    '{
        "prompt": "Create a quest to find a lost artifact",
        "questType": "exploration",
        "difficulty": "medium",
        "theme": "adventure"
    }' \
    "false"

# Test Dialogue generation
test_endpoint \
    "Generate Dialogue" \
    "POST" \
    "/api/content/generate-dialogue" \
    '{
        "npcName": "Elder Wizard",
        "npcPersonality": "wise and mysterious",
        "prompt": "Generate greeting dialogue",
        "context": "The wizard meets the player for the first time"
    }' \
    "false"

# Test Lore generation
test_endpoint \
    "Generate Lore" \
    "POST" \
    "/api/content/generate-lore" \
    '{
        "prompt": "Create lore about an ancient magical order",
        "category": "history",
        "topic": "The Mage Council"
    }' \
    "false"

echo "========================================="
echo "4. Content Retrieval Tests"
echo "========================================="

test_endpoint \
    "List NPCs" \
    "GET" \
    "/api/content/npcs?limit=5" \
    "" \
    "false"

test_endpoint \
    "List Quests" \
    "GET" \
    "/api/content/quests?limit=5" \
    "" \
    "false"

test_endpoint \
    "List Dialogues" \
    "GET" \
    "/api/content/dialogues?limit=5" \
    "" \
    "false"

test_endpoint \
    "List Lore" \
    "GET" \
    "/api/content/lores?limit=5" \
    "" \
    "false"

echo "========================================="
echo "Test Summary"
echo "========================================="
echo -e "${GREEN}✓${NC} = Success (2xx status)"
echo -e "${YELLOW}⚠${NC} = Auth Required (401/403 status)"
echo -e "${RED}✗${NC} = Failed (4xx/5xx status)"
echo ""
echo "To test authenticated endpoints:"
echo "  export AUTH_TOKEN='your-privy-jwt-token'"
echo "  ./test-api-endpoints.sh"
echo ""
echo "To test against local server:"
echo "  export API_URL='http://localhost:8080'"
echo "  ./test-api-endpoints.sh"

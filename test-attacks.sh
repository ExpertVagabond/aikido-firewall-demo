#!/usr/bin/env bash
# Test Aikido Firewall against common attack vectors
PORT=${1:-3001}
BASE="http://localhost:$PORT"

echo "=== Aikido Firewall Attack Tests ==="
echo ""

echo "1. Normal request (should pass):"
curl -s "$BASE/search?q=hello+world" | python3 -c "import sys,json; print(json.dumps(json.load(sys.stdin),indent=2))"
echo ""

echo "2. SQL injection via query param (should block):"
curl -s -o /dev/null -w "HTTP %{http_code}" "$BASE/search?q=%27%3B+DROP+TABLE+users%3B+--"
echo ""
echo ""

echo "3. Path traversal (should block):"
curl -s -o /dev/null -w "HTTP %{http_code}" "$BASE/file?name=../../../etc/passwd"
echo ""
echo ""

echo "4. SQL injection via POST body (should block):"
curl -s -o /dev/null -w "HTTP %{http_code}" -X POST "$BASE/login" \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"'\'' OR 1=1 --"}'
echo ""
echo ""

echo "5. Normal POST (should pass):"
curl -s "$BASE/login" -X POST -H 'Content-Type: application/json' -d '{"username":"admin","password":"test"}' | python3 -c "import sys,json; print(json.dumps(json.load(sys.stdin),indent=2))"
echo ""

echo "=== Done ==="

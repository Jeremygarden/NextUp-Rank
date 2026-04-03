#!/usr/bin/env bash
# check-functions.sh
# 验证所有 Supabase Edge Function 的 verify_jwt=false 且函数可访问
# 用法：bash scripts/check-functions.sh

set -euo pipefail

PROJECT_REF="tesdzxnmffmaxylcpjia"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlc2R6eG5tZmZtYXh5bGNwamlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2MTI5MzIsImV4cCI6MjA5MDE4ODkzMn0.3jXsufGIARrP9iMxMxjorm71aPGOVUlIH3se87yrCBc"
ACCESS_TOKEN="${SUPABASE_ACCESS_TOKEN:-}"

if [ -z "$ACCESS_TOKEN" ] && [ -f ".env.local" ]; then
  ACCESS_TOKEN=$(grep SUPABASE_ACCESS_TOKEN .env.local | cut -d'=' -f2)
fi

if [ -z "$ACCESS_TOKEN" ]; then
  echo "❌ SUPABASE_ACCESS_TOKEN not set"
  exit 1
fi

echo "=== Edge Function verify_jwt 检查 ==="
FUNCTIONS=$(curl -s "https://api.supabase.com/v1/projects/$PROJECT_REF/functions" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

FAIL=0
echo "$FUNCTIONS" | python3 -c "
import json, sys
d = json.load(sys.stdin)
fail = 0
for f in d:
    name = f['name']
    vj = f.get('verify_jwt', True)
    if vj:
        print(f'❌ {name}: verify_jwt=True  ← MUST be False (ES256 JWT incompatible)')
        fail = 1
    else:
        print(f'✅ {name}: verify_jwt=False')
sys.exit(fail)
" || FAIL=1

echo ""
echo "=== 函数可达性测试（期望返回函数自己的错误，不是平台 401）==="
for fn in create-match match-handshake process-match leaderboard; do
  RESP=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
    "https://${PROJECT_REF}.supabase.co/functions/v1/$fn" \
    -H "apikey: $ANON_KEY" \
    -H "Content-Type: application/json" \
    -d '{}')
  # 401 from platform = bad; 401 from function itself = ok (Missing token error body)
  # We test by checking the response body contains a known message
  BODY=$(curl -s -X POST \
    "https://${PROJECT_REF}.supabase.co/functions/v1/$fn" \
    -H "apikey: $ANON_KEY" \
    -H "Content-Type: application/json" \
    -d '{}')
  if echo "$BODY" | grep -q '"error"'; then
    echo "✅ $fn: reachable (got function-level error, not platform 401)"
  else
    echo "❌ $fn: unexpected response: $BODY"
    FAIL=1
  fi
done

echo ""
if [ $FAIL -eq 0 ]; then
  echo "✅ 所有检查通过"
else
  echo "❌ 有检查失败，请修复后重新运行"
  exit 1
fi

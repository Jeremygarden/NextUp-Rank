#!/usr/bin/env bash
# scripts/merge-to-main.sh
# 将 draft/condescending-lumiere 的最新提交通过 PR 合并到 main
# 用法：bash scripts/merge-to-main.sh [pr_title]
#
# 流程：
#   1. 确保 draft 分支是最新的
#   2. 创建 PR（draft → main），若已存在则复用
#   3. 自动 squash merge
#   4. 将 draft rebase 到 main，保持同步

set -euo pipefail

DRAFT_BRANCH="draft/condescending-lumiere"
BASE_BRANCH="main"
REPO="Jeremygarden/NextUp-Rank"

cd "$(git rev-parse --show-toplevel)"

# 确保在 draft 分支
git checkout "$DRAFT_BRANCH"
git fetch origin

# 检查是否有新内容需要 merge
DRAFT_SHA=$(git rev-parse "$DRAFT_BRANCH")
MAIN_SHA=$(git rev-parse "origin/$BASE_BRANCH")

if [ "$DRAFT_SHA" = "$MAIN_SHA" ]; then
  echo "✅ draft 与 main 已一致，无需 merge"
  exit 0
fi

# PR 标题：使用参数或自动生成
PR_TITLE="${1:-$(git log origin/$BASE_BRANCH..HEAD --oneline | head -1 | sed 's/^[a-f0-9]* //')}"

echo "📝 PR 标题: $PR_TITLE"

# 检查是否已有开放的 PR
EXISTING_PR=$(gh pr list --base "$BASE_BRANCH" --head "$DRAFT_BRANCH" --state open --json number --jq '.[0].number' 2>/dev/null || echo "")

if [ -n "$EXISTING_PR" ]; then
  echo "♻️  复用已有 PR #$EXISTING_PR"
  PR_NUMBER="$EXISTING_PR"
else
  # 创建新 PR（输出是 PR URL，从中提取编号）
  PR_URL=$(gh pr create \
    --base "$BASE_BRANCH" \
    --head "$DRAFT_BRANCH" \
    --title "$PR_TITLE" \
    --body "Auto-merged from \`$DRAFT_BRANCH\` by merge-to-main.sh" \
    --repo "$REPO")
  PR_NUMBER=$(echo "$PR_URL" | grep -o '[0-9]*$')
  echo "✅ 创建 PR #$PR_NUMBER: $PR_URL"
fi

# Squash merge
echo "🔀 Squash merging PR #$PR_NUMBER..."
gh pr merge "$PR_NUMBER" \
  --squash \
  --auto \
  --delete-branch=false \
  --repo "$REPO"

# 等待 merge 完成
echo "⏳ 等待 merge 完成..."
for i in $(seq 1 12); do
  STATE=$(gh pr view "$PR_NUMBER" --repo "$REPO" --json state --jq '.state')
  if [ "$STATE" = "MERGED" ]; then
    echo "✅ PR #$PR_NUMBER 已合并"
    break
  fi
  sleep 5
done

# 同步 draft 到 main
git fetch origin
git rebase "origin/$BASE_BRANCH"
git push origin "$DRAFT_BRANCH" --force-with-lease

echo ""
echo "🎉 完成！PR #$PR_NUMBER 已合并到 main，draft 已同步"
echo "🔗 https://github.com/$REPO/pull/$PR_NUMBER"

#!/usr/bin/env bash
# Daily Soulless Food run: starts a headless Claude Code session that follows the
# daily-post skill (.claude/skills/daily-post/SKILL.md): pick a name from the queue sheet,
# write the story and recipe blind, render and check the image on local ComfyUI, build, push.
# Run by ~/.config/systemd/user/soulless-food.timer. Safe to run by hand.
# Extra args are appended to the prompt (e.g. "DRY RUN: don't commit, push or write the sheet").
set -euo pipefail
REPO="$(cd "$(dirname "$(readlink -f "$0")")/.." && pwd)"
export PATH="$HOME/.local/bin:/home/linuxbrew/.linuxbrew/bin:$PATH"
cd "$REPO"
mkdir -p logs

# Tools the session may use without a check; anything else goes through auto mode's safety classifier.
# Passed on the command line so they apply even though headless runs skip the trust dialog.
ALLOWED=(
  "Read" "Glob" "Grep" "Agent" "Skill(daily-post)"
  "Edit(src/content/posts/**)"
  "Bash(git pull:*)" "Bash(git add:*)" "Bash(git commit:*)" "Bash(git push origin master)"
  "Bash(git status:*)" "Bash(git log:*)" "Bash(git diff:*)"
  "Bash(npm run build)" "Bash(ls:*)" "Bash(date:*)" "Bash(grep:*)" "Bash(head:*)"
  "Bash(curl -sf http://127.0.0.1:8188/:*)"
  "Bash(~/ComfyUI/.venv/bin/python scripts/render_images.py:*)"
  "Bash(~/ComfyUI/start.sh --listen 127.0.0.1:*)"
  "Bash(pkill -f \"ComfyUI/main.py\")"
  "mcp__claude_ai_Google_Sheets__get_spreadsheet"
  "mcp__claude_ai_Google_Sheets__get_values"
  "mcp__claude_ai_Google_Sheets__update_values"
)

claude -p "Run the daily-post skill to publish today's Soulless Food post. $*" \
  --permission-mode auto \
  --allowedTools "${ALLOWED[@]}" \
  --output-format text 2>&1 | tee -a "logs/$(date +%F).log"

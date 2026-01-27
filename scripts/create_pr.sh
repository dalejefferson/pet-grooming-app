#!/bin/bash
# Create a pull request (if remote is configured)
set -e
TITLE="${1:-Ralph automated PR}"
BODY="${2:-Automated changes by RalphBlaster}"
if git remote get-url origin &>/dev/null; then
    gh pr create --title "$TITLE" --body "$BODY" 2>/dev/null || echo "PR creation skipped"
else
    echo "No remote configured, skipping PR"
fi

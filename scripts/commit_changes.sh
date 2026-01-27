#!/bin/bash
# Commit all changes with a message
set -e
MESSAGE="${1:-Auto-commit by Ralph}"
git add -A
git commit -m "$MESSAGE" || echo "Nothing to commit"
echo "Changes committed"

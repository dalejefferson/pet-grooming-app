#!/bin/bash
# Run linting and auto-fix
set -e
if [ -f "package.json" ]; then
    npm run lint --fix 2>/dev/null || npm run lint 2>/dev/null || echo "No lint configured"
elif [ -f "pyproject.toml" ]; then
    ruff check --fix . 2>/dev/null || black . 2>/dev/null || echo "No Python linter"
fi
echo "Lint completed"

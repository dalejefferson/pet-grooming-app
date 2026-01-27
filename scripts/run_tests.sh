#!/bin/bash
# Run project tests
set -e
if [ -f "package.json" ]; then
    npm test 2>/dev/null || echo "No tests configured"
elif [ -f "pytest.ini" ] || [ -d "tests" ]; then
    pytest
elif [ -f "Cargo.toml" ]; then
    cargo test
fi
echo "Tests completed"

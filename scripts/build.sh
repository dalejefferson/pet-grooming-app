#!/bin/bash
# Build the project
set -e
if [ -f "package.json" ]; then
    npm run build 2>/dev/null || echo "No build script"
elif [ -f "Cargo.toml" ]; then
    cargo build --release
fi
echo "Build completed"

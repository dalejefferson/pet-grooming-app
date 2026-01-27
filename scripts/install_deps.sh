#!/bin/bash
# Install project dependencies
set -e
if [ -f "package.json" ]; then
    npm install
elif [ -f "requirements.txt" ]; then
    pip install -r requirements.txt
elif [ -f "Cargo.toml" ]; then
    cargo build
fi
echo "Dependencies installed"

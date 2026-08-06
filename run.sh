#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
echo "============================================"
echo "  Pinjal River Tracker - build v5"
echo "============================================"
command -v node >/dev/null || { echo "Node.js not installed. Get the LTS build from https://nodejs.org"; exit 1; }
echo "[1/3] Clearing any stale build cache..."
rm -rf .next
echo "[2/3] Installing dependencies (first run takes a few minutes)..."
npm install --no-audit --no-fund
echo "[3/3] Starting the dashboard on http://localhost:3000"
(sleep 4 && (command -v open >/dev/null && open http://localhost:3000 || xdg-open http://localhost:3000 >/dev/null 2>&1)) &
npm run dev

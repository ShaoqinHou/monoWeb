#!/bin/bash
set -e

echo "=== Installing dependencies ==="
cd pdf-ai-assistant && npm install && cd ..
cd power-plan-ai-comparator && npm install && cd ..
cd cv-web && npm install && cd ..

echo "=== Building all projects ==="
cd pdf-ai-assistant && npm run build && cd ..
cd power-plan-ai-comparator && npm run build && cd ..
cd cv-web && npm run build && cd ..

echo "=== Assembling deploy folder ==="
rm -rf deploy
mkdir -p deploy
cp -r cv-web/dist/* deploy/
cp -r pdf-ai-assistant/dist deploy/pdf-ai-assistant
cp -r power-plan-ai-comparator/dist deploy/power-plan-ai-comparator

echo "=== Done ==="
echo "Serve the 'deploy/' folder with your web server."
echo "Example with nginx: point root to $(pwd)/deploy"

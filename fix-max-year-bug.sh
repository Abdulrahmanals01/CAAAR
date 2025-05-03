#!/bin/bash
# Fix the max_year bug in carController.js

# Create a backup
cp backend/src/controllers/carController.js backend/src/controllers/carController.js.bak-year-fix

# Replace the incorrect parameter with sed
sed -i 's/values.push(max_price); \/\/ FIX: This should be max_year/values.push(max_year); \/\/ Fixed parameter name/' backend/src/controllers/carController.js

echo "✅ Fixed max_year parameter bug in carController.js"

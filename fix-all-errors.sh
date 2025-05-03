#!/bin/bash

echo "=================================="
echo "Fixing all errors in Sayarati app"
echo "=================================="
echo ""

# Run all the fix scripts
./fix-index-jsx.sh
./fix-auth-js.sh
./fix-booking-routes.sh

echo ""
echo "=================================="
echo "All fixes applied successfully!"
echo "=================================="
echo ""
echo "Next steps:"
echo "1. Restart the backend server: cd backend && npm run dev"
echo "2. Restart the frontend server: cd frontend && npm start"
echo ""

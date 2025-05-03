#!/bin/bash

echo "======= Sayarati Diagnostic Tool ======="
echo "Checking environment configuration..."

# Check frontend configuration
if [ -f frontend/.env ]; then
  echo "✅ Frontend .env file exists"
  grep -q "REACT_APP_API_URL" frontend/.env && echo "✅ REACT_APP_API_URL is configured" || echo "❌ REACT_APP_API_URL is missing"
else
  echo "❌ Frontend .env file is missing"
fi

# Check backend configuration
if [ -f backend/.env ]; then
  echo "✅ Backend .env file exists"
  grep -q "JWT_SECRET" backend/.env && echo "✅ JWT_SECRET is configured" || echo "❌ JWT_SECRET is missing"
else
  echo "❌ Backend .env file is missing"
fi

# Check if frontend proxy is configured
if grep -q "\"proxy\":" frontend/package.json; then
  echo "✅ Frontend proxy is configured"
else
  echo "❌ Frontend proxy is not configured"
fi

# Check if backend is running
if curl -s -o /dev/null -w "%{http_code}" http://localhost:5000 > /dev/null; then
  echo "✅ Backend server is running on port 5000"
else
  echo "❌ Backend server is not running on port 5000"
fi

# Check if required modules are installed
echo "Checking required npm modules..."
cd frontend && npm list axios > /dev/null 2>&1 && echo "✅ axios is installed" || echo "❌ axios is missing"
cd ../backend && npm list express > /dev/null 2>&1 && echo "✅ express is installed" || echo "❌ express is missing"
npm list jsonwebtoken > /dev/null 2>&1 && echo "✅ jsonwebtoken is installed" || echo "❌ jsonwebtoken is missing"

echo "Diagnostic completed."

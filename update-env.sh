#!/bin/bash

ENV_FILE="./frontend/.env"

# Check if .env file exists, create it if not
if [ ! -f $ENV_FILE ]; then
  echo "Creating new .env file..."
  touch $ENV_FILE
fi

# Check if REACT_APP_API_URL is already set
if ! grep -q "REACT_APP_API_URL" $ENV_FILE; then
  echo "Adding REACT_APP_API_URL to .env file..."
  echo "REACT_APP_API_URL=http://localhost:5000" >> $ENV_FILE
else
  # Update existing REACT_APP_API_URL
  sed -i 's|REACT_APP_API_URL=.*|REACT_APP_API_URL=http://localhost:5000|g' $ENV_FILE
fi

echo "Environment configuration complete. Please restart your frontend development server."

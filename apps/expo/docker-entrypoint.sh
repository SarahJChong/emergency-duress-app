#!/bin/bash
set -e

echo "🛠 Updating existing .env values from environment..."

cp .env .env.updated

# Update ONLY existing keys in .env
while IFS='=' read -r key value; do
  key_name="${key}"
  echo "$key_name"
  if grep -q "^${key_name}=" .env; then
    echo "Updating $key_name=$value"
    sed -i "s|^${key_name}=.*|${key_name}=$value|" .env.updated
  fi
done < <(env | grep '^EXPO_')
cat .env.updated > .env
rm .env.updated

npm install --legacy-peer-deps

ls -al

echo "🚀 Starting Expo..."
exec npm start

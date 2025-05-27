#!/bin/bash
set -e

echo "🔑 Generating VAPID keys..."

# Run web-push and capture output
output=$(web-push generate-vapid-keys)

# Extract keys from output
public=$(echo "$output" | grep "Public Key" -A 1 | tail -n 1)
private=$(echo "$output" | grep "Private Key" -A 1 | tail -n 1)

# File to update
ENV_FILE=".env"
cp $ENV_FILE "$ENV_FILE.updated"

# Function to add or update a key
update_or_add() {
  local key=$1
  local value=$2

  if grep -q "^$key=" "$ENV_FILE.updated"; then
    # Update existing
    sed -i.bak "s|^$key=.*|$key=$value|" "$ENV_FILE.updated"
  else
    # Append new
    echo -e "\n$key=$value" >> "$ENV_FILE.updated"
  fi
}

# Apply updates
update_or_add "VAPID_PUBLIC_KEY" "$public"
update_or_add "VAPID_PRIVATE_KEY" "$private"
update_or_add "EXPO_PUBLIC_VAPID_KEY" "$public"

cat $ENV_FILE.updated > $ENV_FILE
rm $ENV_FILE.updated


echo "✅ .env updated with VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY"

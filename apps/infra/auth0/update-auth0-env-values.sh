#!/bin/bash
set -e

ENV_FILE=".env"

# Usage: ./script.sh "Client Name"
SPA_CLIENT_NAME="${1:-Emergency Duress App (SPA)}"

# Read required values from environment variables
AUTH0_DOMAIN="${AUTH0_DOMAIN:?AUTH0_DOMAIN environment variable is required}"
MGMT_CLIENT_ID="${AUTH0_CLIENT_ID:?AUTH0_CLIENT_ID environment variable is required}"
MGMT_CLIENT_SECRET="${AUTH0_CLIENT_SECRET:?AUTH0_CLIENT_SECRET environment variable is required}"

echo "Using Auth0 Domain: $AUTH0_DOMAIN"
echo "Using Client ID: $MGMT_CLIENT_ID"
echo "Looking for client: $SPA_CLIENT_NAME"

# Get management API access token
ACCESS_TOKEN=$(curl -s --request POST \
  --url "https://${AUTH0_DOMAIN}/oauth/token" \
  --header 'content-type: application/json' \
  --data '{
    "client_id": "'"${MGMT_CLIENT_ID}"'",
    "client_secret": "'"${MGMT_CLIENT_SECRET}"'",
    "audience": "https://'${AUTH0_DOMAIN}'/api/v2/",
    "grant_type": "client_credentials"
  }' | jq -r '.access_token')

if [[ "$ACCESS_TOKEN" == "null" || -z "$ACCESS_TOKEN" ]]; then
  echo "❌ Failed to get access token"
  exit 1
fi

# Query clients and find the SPA client ID
CLIENT_ID=$(curl -s --request GET \
  --url "https://${AUTH0_DOMAIN}/api/v2/clients" \
  --header "Authorization: Bearer $ACCESS_TOKEN" \
  | jq -r '.[] | select(.name == "'"${SPA_CLIENT_NAME}"'") | .client_id')

if [[ -z "$CLIENT_ID" ]]; then
  echo "❌ SPA client '$SPA_CLIENT_NAME' not found"
  exit 1
fi

cp $ENV_FILE "$ENV_FILE.updated"
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

update_or_add "EXPO_PUBLIC_AUTH_CLIENT_ID" "$CLIENT_ID"
update_or_add "EXPO_PUBLIC_AUTH_ENDPOINT" "https://$AUTH0_DOMAIN"


# mv "$ENV_FILE.updated" "$ENV_FILE"
cat $ENV_FILE.updated > $ENV_FILE
rm $ENV_FILE.updated

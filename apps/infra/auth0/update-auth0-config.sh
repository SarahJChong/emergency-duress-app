#!/bin/bash

set -e

if [ $# -ne 2 ]; then
  echo "Usage: $0 <WEB_URL> <API_URL>"
  exit 1
fi

WEB_URL="$1"
API_URL="$2"
CONFIG_FILE="auth0-config/tenant.yaml"

echo "🔧 Updating Auth0 config:"
echo "- Web URL: $WEB_URL"
echo "- API URL: $API_URL"
echo "- File: $CONFIG_FILE"

# Update SPA client URLs
yq -y -i '
  (.clients[] | select(.name == "Emergency Duress App (SPA)") |
    .callbacks) = ["'"$WEB_URL"'/sign-in"] |
  (.clients[] | select(.name == "Emergency Duress App (SPA)") |
    .allowed_logout_urls) = ["'"$WEB_URL"'"] |
  (.clients[] | select(.name == "Emergency Duress App (SPA)") |
    .web_origins) = ["'"$WEB_URL"'"]
' "$CONFIG_FILE"

# Update resourceServer identifier
yq -y -i '
  (.resourceServers[] | select(.identifier == "http://localhost:5052/") |
    .identifier) = "'"$API_URL"'"
' "$CONFIG_FILE"

# Update clientGrants audience
yq -y -i '
  (.clientGrants[] | select(.audience == "http://localhost:5052/") |
    .audience) = "'"$API_URL"'"
' "$CONFIG_FILE"

echo "✅ Auth0 config updated successfully in $CONFIG_FILE."

#!/bin/bash
set -e


CONFIG_FILE="/app/appsettings.Development.json"
cp $CONFIG_FILE "$CONFIG_FILE.updated"

echo "🔧 Updating $CONFIG_FILE from environment variables..."

set_config_value() {
  local env_value="$1"
  local json_path="$2"

  if [ -n "$env_value" ]; then
    jq --arg val "$env_value" "$json_path = \$val" "$CONFIG_FILE.updated" > tmp.$$.json && mv tmp.$$.json "$CONFIG_FILE.updated"
    echo "✅ Updated $env_value"
  else
    echo "ℹ️  Skipped $env_value (no value set)"
  fi
}

# Update values from env vars
set_config_value "https://$AUTH0_DOMAIN" ".Authentication.Authority"
set_config_value "$API_URL" ".Authentication.Audience"
set_config_value "$EXPO_PUBLIC_RESOURCES_URL" ".Cors.AllowedOrigin"
set_config_value "$DEFAULT_SENDER_EMAIL" ".Notifications.Email.DefaultSenderEmail"
set_config_value "$EXPO_PUBLIC_RESOURCES_URL" ".Notifications.Email.WebAppBaseUrl"
set_config_value "$VAPID_PUBLIC_KEY" ".Notifications.WebPush.VapidPublicKey"
set_config_value "$VAPID_PRIVATE_KEY" ".Notifications.WebPush.VapidPrivateKey"
set_config_value "$VAPID_PUBLIC_KEY" ".WebPush.VapidPublicKey"
set_config_value "$VAPID_PRIVATE_KEY" ".WebPush.VapidPrivateKey"

echo "✅ Config updated."

cat $CONFIG_FILE.updated > $CONFIG_FILE
rm $CONFIG_FILE.updated


exec dotnet Api.dll

# Use official Node.js image
FROM node:18-slim

# Set working directory
WORKDIR /app

# Install web-push globally
RUN npm install -g web-push

# Create volume mount point for .env
VOLUME ["/app"]

# Set default command to run the script
ENTRYPOINT ["/app/generate-vapid-env.sh"]

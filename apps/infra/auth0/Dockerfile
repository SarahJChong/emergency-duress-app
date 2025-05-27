FROM node:18

# Install curl
RUN apt-get update && apt-get install -y curl jq && rm -rf /var/lib/apt/lists/*

# Create working directory
WORKDIR /app

# Install Auth0 Deploy CLI globally
RUN npm install -g auth0-deploy-cli

# Default entrypoint (can be overridden in compose)
ENTRYPOINT [ "a0deploy" ]

# Use official Node.js image
FROM node:18

# Set working directory
WORKDIR /app

# Copy project files
COPY ./expo/package.json ./expo/package-lock.json ./
RUN npm install --legacy-peer-deps

# Copy the rest of the project
COPY ./expo .

# Expose Expo ports
EXPOSE 8081 19000 19001 19002

ENTRYPOINT ["/app/docker-entrypoint.sh"]

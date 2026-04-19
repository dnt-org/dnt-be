# Use Node.js LTS (Long Term Support) version
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package manifests first for layer caching
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy pre-built artifacts from CI
COPY build ./build
COPY public ./public
COPY config ./config
COPY database ./database
COPY src ./src
COPY ca.pem ./ca.pem

# Expose the port Strapi runs on
EXPOSE 1337

# Start the application
CMD ["npm", "run", "start"]
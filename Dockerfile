# Use a lightweight Debian-based Node.js LTS image
FROM node:20-bookworm-slim

# Install GCC, Make, and basic build tools required to compile C code
RUN apt-get update && apt-get install -y \
    gcc \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory inside the container
WORKDIR /app

# Copy dependency configuration files first to optimize cache layer rebuilding
COPY package*.json ./

# Install all dependencies (production + development, needed for build steps)
RUN npm install

# Copy all application source files to the container
COPY . .

# Build the Vite frontend and bundle the Express backend server
RUN npm run build

# Set the environment variables for production
ENV NODE_ENV=production
ENV PORT=3000

# Expose the server port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]

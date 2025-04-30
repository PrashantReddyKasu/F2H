# Use Node.js as the base image
FROM node:18-alpine as base

# Set working directory
WORKDIR /app

# Install dependencies for backend
COPY backend/package*.json ./backend/
RUN cd backend && npm install

# Install dependencies for frontend
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install

# Copy all files
COPY . .

# Build frontend
RUN cd frontend && npm run build

# Expose port
EXPOSE 5000

# Start the application
CMD ["node", "backend/server.js"]

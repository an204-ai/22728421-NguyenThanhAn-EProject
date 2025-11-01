# Base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose port (sẽ tùy chỉnh cho từng service)
EXPOSE 3001

# Start service
CMD ["sh", "-c", "until nc -z rabbitmq 5672; do echo 'Waiting for RabbitMQ...'; sleep 2; done; node index.js"]

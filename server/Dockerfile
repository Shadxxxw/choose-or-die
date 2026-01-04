FROM node:20-slim

# Install Python
RUN apt-get update && apt-get install -y python3 python3-pip && rm -rf /var/lib/apt/lists/*

# Create python symlink
RUN ln -s /usr/bin/python3 /usr/bin/python

# Install edge-tts
RUN pip3 install edge-tts --break-system-packages

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node dependencies
RUN npm install

# Copy source
COPY . .

# Expose port
EXPOSE 3000

# Start server
CMD ["node", "index.js"]

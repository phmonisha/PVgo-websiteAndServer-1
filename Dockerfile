
# Use an official Node.js runtime as the base image
FROM node:latest

# Set a working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json (if available) to the working directory
COPY package*.json ./

# Install project dependencies
RUN npm install

# Copy the rest of the application source code
COPY . .

# Expose a port (if your Node.js app listens on a specific port)
EXPOSE 3010

# Define the command to run your Node.js application
CMD ["node", "app.js"]

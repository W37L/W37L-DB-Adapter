# Use the official Node.js 18 image as a parent image
FROM node:18

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy the package.json and package-lock.json files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your app's source code from your host to your image filesystem.
COPY . .

# Build your TypeScript files (if you are using TypeScript)
RUN npm run build

# Inform Docker that the container listens on the specified port at runtime.
EXPOSE 3000

# Define the command to run your app using CMD which defines your runtime. Here we will use node to run the compiled server file.
CMD [ "node", "dist/server.js" ]

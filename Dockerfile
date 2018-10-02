# Use the base image with Node.js 8.12
FROM node:8.12

# Set working directory for future use
WORKDIR /topcoder-x-ui

COPY package.json .
COPY package-lock.json .

# Install the dependencies from package.json
RUN npm install

COPY . .

RUN npm run build

ENTRYPOINT npm start

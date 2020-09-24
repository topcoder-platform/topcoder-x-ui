# Use the base image with Node.js
FROM node:8.12

# Copy the current directory into the Docker image
COPY . /topcoder-x-ui

# Set working directory for future use
WORKDIR /topcoder-x-ui

# Install the dependencies from package.json
RUN npm install esm
RUN npm install
RUN npm run build
#RUN npm test

CMD npm start

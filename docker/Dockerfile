# Use the base image with Node.js
FROM node:20

# Copy the current directory into the Docker image
COPY . /topcoder-x-ui

# Set working directory for future use
WORKDIR /topcoder-x-ui

# Install the dependencies from package.json
RUN git config --global url."https://git@".insteadOf git://
RUN npm install --legacy-peer-deps
RUN npm run build
#RUN npm test

CMD npm start

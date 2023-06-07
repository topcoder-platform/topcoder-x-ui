# Use the base image with Node.js
FROM node:14

# Copy the current directory into the Docker image
COPY . /topcoder-x-ui

# Set working directory for future use
WORKDIR /topcoder-x-ui

# Install the dependencies from package.json
RUN npm config set unsafe-perm true
RUN git config --global url."https://git@".insteadOf git://
RUN npm install
RUN npm run build
#RUN npm test

CMD npm start

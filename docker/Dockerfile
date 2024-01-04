# Use the base image with Node.js
FROM node:20

WORKDIR /topcoder-x-ui
RUN git config --global url."https://git@".insteadOf git://
COPY package.json package-lock.json* ./
RUN npm ci --silent --legacy-peer-deps
COPY . .
RUN npm run build

CMD npm start

# Use the base image with Node.js
FROM node:20

WORKDIR /usr/src/app
RUN git config --global url."https://git@".insteadOf git://
COPY package.json package-lock.json* ./
RUN npm ci --silent --legacy-peer-deps
COPY . .
RUN npm run build

CMD npm start

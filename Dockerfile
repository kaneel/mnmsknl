FROM node:12.14.1
WORKDIR /usr/src/app
COPY package.json .
COPY package-lock.json .
RUN npm install
COPY ./src/ ./src
COPY ./config.js .
COPY ./statics/ ./statics
RUN node ./src/client.js
COPY ./server/ ./server
CMD ["node", "server/server.js"]

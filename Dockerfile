FROM node:20

WORKDIR /app

COPY package*.json ./

RUN npm ci
RUN npm install -g ts-node typescript

COPY . .

EXPOSE 3000

CMD ["ts-node", "src/server.ts"]
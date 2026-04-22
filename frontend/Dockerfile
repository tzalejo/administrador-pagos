FROM node:22.19.0-alpine

RUN npm install -g npm@latest

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev"]

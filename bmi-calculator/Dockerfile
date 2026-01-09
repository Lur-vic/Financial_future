FROM node:20-alpine

WORKDIR /app

COPY . .

RUN npm install express

EXPOSE 80

CMD ["node", "app.js"]
FROM node

WORKDIR /app

COPY package.json .
COPY package-lock.json .

RUN npm install

EXPOSE 6969

COPY index.js .

CMD ["node", "."]
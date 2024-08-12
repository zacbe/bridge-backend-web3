FROM node:18-alpine

WORKDIR /app
COPY . /app
RUN npm install

# Bundle app source
COPY . .

RUN npm run build

EXPOSE 3001
ENTRYPOINT ["node", "dist/main.js"]
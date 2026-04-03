FROM node:25-alpine
WORKDIR /app
COPY . .
RUN npm install --save-dev
CMD ["npm","run","start"]
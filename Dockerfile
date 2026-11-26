FROM node:20-alpine
WORKDIR /app
COPY package.json ./
COPY frontend/package.json ./frontend/
RUN npm run postinstall
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]

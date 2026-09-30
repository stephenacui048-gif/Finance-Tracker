FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Build frontend if dist doesn't already exist
RUN if [ ! -f "dist/index.html" ]; then npm run build; fi

EXPOSE 3000
ENV PORT=3000
ENV NODE_ENV=production

CMD ["npm", "start"]

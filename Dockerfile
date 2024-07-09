FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ENV QUEUE=true
ENV QUEUE_LENGTH=10
ENV PORT=14080
EXPOSE 14080
CMD ["npm", "start"]
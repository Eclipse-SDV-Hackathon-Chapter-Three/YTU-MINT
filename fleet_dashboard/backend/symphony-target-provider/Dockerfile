FROM node:18-alpine

WORKDIR /app

# Install Ankaios CLI (if available)
# RUN apk add --no-cache curl && \
#     curl -L https://github.com/eclipse-ankaios/ankaios/releases/latest/download/ankaios-linux-amd64.tar.gz | tar -xz -C /usr/local/bin/

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 8081

CMD ["npm", "start"]

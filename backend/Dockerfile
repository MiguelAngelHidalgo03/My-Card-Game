FROM node:18-alpine

WORKDIR /app

# Copiamos solo package.json para cachear dependencias
COPY package*.json ./
RUN npm install --production

# Copiamos el resto de la app
COPY . .

# Opcional: si quieres copiar el .env aquí (menos seguro)
# COPY .env .env

EXPOSE 5000

CMD ["npm", "start"]

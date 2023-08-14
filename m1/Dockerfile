# Используем базовый образ Node.js
FROM node:17

# Создаем и устанавливаем директорию приложения
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем исходный код приложения
COPY . .

# Открываем порт, на котором будет работать микросервис
EXPOSE 3001

# Запускаем микросервис
CMD ["node", "m1.js"]
# Usa uma imagem base que já tem Node.js
FROM node:18-bullseye

# Instala o FFmpeg (obrigatório para mexer com vídeo)
RUN apt-get update && apt-get install -y ffmpeg

# Cria a pasta do app
WORKDIR /app

# Copia os arquivos do projeto e instala dependências
COPY package*.json ./
RUN npm install

# Copia o resto do código
COPY . .

# Expõe a porta do servidor
EXPOSE 3000

# Comando para iniciar
CMD ["node", "server.js"]

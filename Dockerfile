FROM node:20-alpine

# Instala dependências básicas para building (se necessário)
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copia arquivos de dependência do package
COPY package*.json ./

# Instala as dependências do Node.js
RUN npm install

# Copia o restante dos arquivos do projeto
COPY . .

# Expõe a porta que o Vite utiliza
EXPOSE 3000

# Executa o servidor de desenvolvimento do Vite com suporte a hot-reload
CMD ["npm", "run", "dev"]

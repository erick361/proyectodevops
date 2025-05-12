FROM node:18 as build

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Establecer variables de entorno en tiempo de construcción
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=${REACT_APP_API_URL}

RUN npm run build

# Etapa de producción
FROM nginx:alpine

# Copiar configuración para SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
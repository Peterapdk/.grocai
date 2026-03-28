FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG GEMINI_API_KEY
ARG API_KEY
ARG FIREBASE_PROJECT_ID
ENV GEMINI_API_KEY=${GEMINI_API_KEY}
ENV API_KEY=${API_KEY}
ENV FIREBASE_PROJECT_ID=${FIREBASE_PROJECT_ID}
RUN npm run build

FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]

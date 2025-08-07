FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS build
WORKDIR /app
COPY . .
ENV VITE_BACKEND_URL=http://server:3000
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
COPY --from=build /app .

EXPOSE 5173
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "5173"]


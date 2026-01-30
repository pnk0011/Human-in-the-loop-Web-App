






https://vl6dkatfng.execute-api.us-east-2.amazonaws.com/uat/mpg-uat-hil-download-all-policies?status
 



==============================================================
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json .
RUN npm install
COPY . .
RUN PUBLIC_URL=/humanLoop/seniorcare npm run build
# RUNTIME
FROM node:20-alpine AS runner
WORKDIR /usr/app
RUN npm install -g serve
COPY --from=builder /app/build ./build
EXPOSE 3000
CMD ["serve", "-s", "build", "-l", "3000"]FROM node:20-alpine AS builder

# Stage 1: Build the application
FROM node:20-alpine AS builder
WORKDIR /app
COPY frontend/package*.json ./
RUN npm install
ARG ENV_FILE
ENV ENV_FILE=$ENV_FILE
RUN echo "ENV_FILE is $ENV_FILE"
COPY frontend/ .  
 
RUN if [ "$ENV_FILE" = "uat" ]; then \
      cp .env.staging .env; \
    elif [ "$ENV_FILE" = "prod" ]; then \
      cp .env.live .env; \
    elif [ "$ENV_FILE" = "dev" ]; then \
      cp .env.development .env; \
    fi
 
RUN npm run build
FROM node:20-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=builder /app/build ./build
EXPOSE 3000
CMD ["serve", "-s", "build", "-l", "3000"]

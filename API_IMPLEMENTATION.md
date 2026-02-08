
 Open issues

1. around 90% done -"Once the document is approved it should automatically move out from QC bucket or an indication of that document is fully approved. 
If the entire policy is approved, the system should come back to  QC dashboard  (this was working till 2nd Feb 2026, but not working from 3rd Feb 2026). This functionality is to be reintstated. "

2. "We need to see the data in UI now in order  P1->P2->P3 (Confidence less than 90% and P1 > P2 > P3) 
Out of all the fields in a dataset having less than 90% confidence score, the order of fields displayed in Reviewer and QC should be..
P1 fields less than 90%
P2 fields less than 90%
P3 fields less than 90%

Once the fields with less than 90% are displayed then other fields that has more than 90% confidence can be displayed in P1 - P2 - P3 order"

3. In case of multiple datasets, once a dataset is approved, it should immediately have an indication as "approved".  It was working till 2nd Feb 2026 whereas not working from 3rd Feb 2026. This functionality is to be reinstated. 


====================================================================



Upadted API - https://vl6dkatfng.execute-api.us-east-2.amazonaws.com/uat/admin-download







====================================================================================================






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

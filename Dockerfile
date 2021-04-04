FROM node:lts AS build
WORKDIR /app
COPY . .
RUN yarn install
CMD ["node", "."]

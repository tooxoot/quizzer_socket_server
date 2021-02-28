FROM node:14-alpine as build
ARG GITHUB_READ_PACKAGES_TOKEN
ENV GITHUB_READ_PACKAGES_TOKEN=$GITHUB_READ_PACKAGES_TOKEN
WORKDIR /app
COPY --chown=node . .
RUN npm install --only=prod
RUN npm run build

FROM build as test
WORKDIR /app
Run npm install
CMD ["npm", "run", "test"]

FROM node:14-alpine as release
WORKDIR /app
COPY --from=build /app/node_modules node_modules
COPY --from=build /app/dist .
CMD ["node", "app.js"]

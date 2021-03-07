FROM node:14-alpine as build
ARG GITHUB_READ_PACKAGES_TOKEN
ENV GITHUB_READ_PACKAGES_TOKEN=$GITHUB_READ_PACKAGES_TOKEN
WORKDIR /app
COPY --chown=node . .
RUN npm install --production
RUN cp -r node_modules node_modules_prod
RUN npm install
RUN npm run build

FROM build as test
WORKDIR /app
CMD ["npm", "run", "test"]

FROM node:14-alpine as release
WORKDIR /app
COPY --from=build /app/node_modules_prod node_modules
COPY --from=build /app/dist .
CMD ["node", "app.js"]

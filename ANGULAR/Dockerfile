FROM node:24.21.0-bookworm-slim@sha256:0e0ff40c39bc087845bfb27465a0df4ea419520094bc35842ff83dd8cbe6f9b6 AS dependencies
WORKDIR /workspace/ANGULAR
RUN chown node:node /workspace /workspace/ANGULAR
USER node
COPY --chown=node:node package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM dependencies AS development
COPY --chown=node:node . .
USER node
EXPOSE 4200
CMD ["npm", "run", "start", "--", "--host", "0.0.0.0", "--port", "4200", "--poll", "1000"]

FROM dependencies AS build
COPY --chown=node:node . .
RUN npm run build

FROM nginx:1.30.5-alpine@sha256:0985e772fb9f729e6fa0980da05fca5d9c468e870eed43071545afa9d2e27d94 AS production
COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=build --chown=nginx:nginx /workspace/ANGULAR/dist/roadmap-web/browser /usr/share/nginx/html
USER nginx
EXPOSE 8080
ENTRYPOINT ["nginx"]
CMD ["-g", "daemon off;"]

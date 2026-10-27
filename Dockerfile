FROM node:26.12.1-alpine3.24@sha256:40cd011b55415bc894e45b02fdd5a5dfde056921b7d23a64c74f80497af48797 AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY . .
RUN npm run lint && npm run typecheck && npm test && npm run build

FROM nginxinc/nginx-unprivileged:1.31.7-alpine-slim@sha256:a8cb0f33d51fa107c96fd2bd3a71aaf564ec131e9d2bdf8700944f0ed8b170d7
LABEL org.opencontainers.image.source="https://github.com/christopherjnelson/Arcadyan-5G-Web-Admin" \
      org.opencontainers.image.title="Arcadyan 5G Web Admin" \
      org.opencontainers.image.description="Web admin and LAN API proxy for the Arcadyan KVD21 gateway"
# Apply available OS security fixes released since the pinned base was built.
USER root
RUN apk upgrade --no-cache
ENV GATEWAY_HOST=192.168.12.1 GATEWAY_PORT=80
COPY --from=build /app/dist /usr/share/nginx/html
COPY docker/nginx.conf.template /etc/nginx/arcadyan.conf.template
COPY docker/security-headers.conf /etc/nginx/security-headers.conf
COPY --chmod=755 docker/entrypoint.sh /usr/local/bin/arcadyan-entrypoint
USER 101:101
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1
ENTRYPOINT ["/usr/local/bin/arcadyan-entrypoint"]

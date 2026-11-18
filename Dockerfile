FROM node:22.22.0-alpine3.23
WORKDIR /app

RUN mkdir -p /data && chown node:node /data
COPY package.json ./
COPY src/ ./src/
COPY migrations/ ./migrations/

ARG APP_VERSION=1.0.0
ENV APP_VERSION=${APP_VERSION}

USER node
EXPOSE 3000
HEALTHCHECK --interval=2s --timeout=3s --start-period=2s --retries=3 CMD ["node", "-e", "fetch('http://127.0.0.1:' + (process.env.PORT || 3000) + '/health', {signal: AbortSignal.timeout(2000)}).then(r => {if (!r.ok) process.exitCode = 1}).catch(() => {process.exitCode = 1})"]
CMD ["node", "src/server.js"]

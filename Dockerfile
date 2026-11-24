FROM node:22-alpine

ENV NODE_ENV=production HOST=0.0.0.0
WORKDIR /app
COPY --chown=node:node server.cjs index.html app.js curriculum.js administration.js administration-shell.js shell.js guidance.js style.css terminal.css ./
USER node
EXPOSE 8080
CMD ["node", "server.cjs"]

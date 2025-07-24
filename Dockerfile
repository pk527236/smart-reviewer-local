# Stage 1: Build
FROM node:23.6.1 AS builder
WORKDIR /app

# Pass GitHub token to install private packages
ARG GITHUB_TOKEN
RUN npm config set //npm.pkg.github.com/:_authToken=$GITHUB_TOKEN

# Copy and install dependencies
COPY package*.json ./
RUN npm install

# Copy app source
COPY . .

# Build the SvelteKit app using adapter-node
RUN npm run build

# Stage 2: Production Image
FROM node:23.6.1 AS runner
WORKDIR /app

# Copy production build and dependencies
COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY .env .env

# Expose desired port
ENV PORT=5173
EXPOSE 5173

# Start the app using adapter-node entrypoint
CMD ["node", "build"]

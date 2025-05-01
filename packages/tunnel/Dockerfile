FROM oven/bun:1

WORKDIR /app

# Copy package files first for better layer caching
COPY package.json ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source files
COPY . .

# Build the application
RUN bun run build

# Expose default port
EXPOSE 1337

# Set default command to run the server
# Can be overridden with docker run command-line args
CMD ["./dist/tunnel", "server", "--configFile", "/config.json"]

FROM oven/bun:1

WORKDIR /app

# Copy package files first for better layer caching
COPY package.json ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source files
COPY . .

# Build the Next.js application
RUN bun run build

# Expose default Next.js port
EXPOSE 3000

# Set default command to run the Next.js server
CMD ["bun", "run", "start"]
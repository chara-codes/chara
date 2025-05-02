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

# Create entrypoint script
RUN echo '#!/bin/sh\n\
echo "Pushing database schema..."\n\
bun run db:push\n\
\n\
echo "Starting server..."\n\
exec "$@"' > /app/entrypoint.sh && chmod +x /app/entrypoint.sh

# Expose default port (adjust as needed for your server)
EXPOSE 3000

# Use entrypoint to push schema before starting
ENTRYPOINT ["/app/entrypoint.sh"]

# Set default command to run the server
CMD ["./dist/server"]

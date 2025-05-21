import { TunnelClient } from '../src/client';

/**
 * Example: Using Chara Tunnel as an API Proxy
 * 
 * This example shows how to use the tunnel client to proxy requests
 * to external APIs while adding custom headers. This is useful for:
 * 
 * - Adding authentication headers to third-party API requests
 * - Hiding API keys from client-side code
 * - Transforming requests or responses
 * - Getting around CORS restrictions
 */

// Create a tunnel client
const client = new TunnelClient({
  port: 3000,          // The local port to serve non-proxied requests
  host: 'localhost',   // The local host to serve non-proxied requests
  subdomain: 'my-api', // Request a specific subdomain (optional)
});

// Connect to the tunnel server
client.connect();

// Set up an event handler for when the connection is established
client.on('open', () => {
  console.log('Connected to tunnel server');
});

// Set up an event handler for when a subdomain is assigned
client.on('subdomain_assigned', (data) => {
  console.log(`Tunnel created! Your API is available at: ${data.url}`);
  console.log(`Local requests will be forwarded to: ${data.localServer}`);
  console.log(`OpenRouter requests will be forwarded to OpenRouter's API`);
});

// Proxy POST requests to the /api/v1/* path to OpenRouter
// This approach is useful when you want to handle only specific HTTP methods
client.route({
  method: 'POST',
  url: '/api/v1/:path*',
  redirect: {
    url: 'https://openrouter.ai/api/v1',
    headers: {
      'Authorization': 'Bearer <OPENROUTER_API_KEY>',
      'HTTP-Referer': '<YOUR_SITE_URL>', // Optional. Site URL for rankings on openrouter.ai.
      'X-Title': '<YOUR_SITE_NAME>', // Optional. Site title for rankings on openrouter.ai.
      'Content-Type': 'application/json',
    }
  }
});

// Alternatively, you can redirect ALL HTTP methods from a path pattern
// This is more convenient when you want to proxy an entire API
client.redirectAll('/api/v2/:path*', {
  url: 'https://openrouter.ai/api/v2',
  headers: {
    'Authorization': 'Bearer <OPENROUTER_API_KEY>',
    'HTTP-Referer': '<YOUR_SITE_URL>',
    'X-Title': '<YOUR_SITE_NAME>',
  }
});

// Add a second proxy route for another third-party API
// Using redirectAll for all methods (GET, POST, PUT, DELETE, etc.)
client.redirectAll('/weather/:path*', {
  url: 'https://api.weatherapi.com/v1',
  headers: {
    'key': '<WEATHER_API_KEY>'
  }
});

// You can also mix proxied and custom routes
client.route({
  method: 'GET',
  url: '/status',
  handler: async (request, reply) => {
    return {
      status: 'online',
      timestamp: new Date().toISOString(),
      routes: [
        { path: '/api/v1/*', methods: ['POST'] },
        { path: '/api/v2/*', methods: ['ALL'] },
        { path: '/weather/*', methods: ['ALL'] },
        { path: '/status', methods: ['GET'] }
      ]
    };
  }
});

// Handle errors
client.on('error', (error) => {
  console.error('Tunnel error:', error);
});

// Keep the process running
process.on('SIGINT', () => {
  console.log('Shutting down tunnel...');
  client.disconnect();
  process.exit(0);
});

console.log('Starting API proxy tunnel...');
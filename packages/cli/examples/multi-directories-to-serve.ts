import { serveStaticAction } from "../src/actions";

const { server, port, url } = await serveStaticAction({
  port: 3001,
  directories: {
    "/": "../web/dist", // HTML import
    "/widget": "../widget/dist", // HTML import
  },
  development: {
    hmr: true,
    console: true,
  },
  bundling: {
    enabled: true,
    cache: true,
    minify: false,
  },
  verbose: true,
});

console.log(server);

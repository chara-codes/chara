import { logger } from "@chara/logger";
import {
  statusController,
  miscController,
  beautifyController,
  modelsController,
  providersController,
  chatController,
} from "./controllers";

const server = Bun.serve({
  port: 3031,
  routes: {
    // Static routes
    "/api/chat": chatController,
    "/api/status": statusController.getStatus,
    "/api/models": modelsController.getModels,
    "/api/providers": providersController.list,
    "/api/beautify": beautifyController,

    // Wildcard route for all routes that start with "/api/" and aren't otherwise matched
    "/api/*": miscController.notFound,
  },

  // (optional) fallback for unmatched routes:
  // Required if Bun's version < 1.2.3
  fetch: miscController.fallback,
});
logger.server(`Server started on port ${server.port}`);

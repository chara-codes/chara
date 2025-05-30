import { logger } from "@chara/logger";
import { providersRegistry } from "../src/providers";

logger.info("Statuses:", providersRegistry.getProviderStatus());

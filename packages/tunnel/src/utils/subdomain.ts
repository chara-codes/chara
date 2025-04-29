import { humanId } from "human-id";
import type { ServerWebSocket } from "bun";
import type { ClientData } from "../types/server.types";
import { logger } from "./logger";

/**
 * Generate a unique human-readable subdomain
 */
export function generateSubdomain(): string {
  // Generate a friendly, readable ID like "brave-golden-wolf"
  const id = humanId({
    separator: "-",
    capitalize: false,
  });
  return `chara-${id}`;
}

/**
 * Allocate a subdomain for a client
 *
 * @param desiredSubdomain - Optional subdomain requested by the client
 * @param clients - Map of existing clients
 * @returns Object containing the allocated subdomain and whether the requested one was used
 */
export function allocateSubdomain(
  desiredSubdomain: string | undefined | null,
  clients: Map<string, ServerWebSocket<ClientData>>,
): { subdomain: string; usedRequestedSubdomain: boolean } {
  let subdomain = "";
  let usedRequestedSubdomain = false;

  if (desiredSubdomain) {
    // Validate the requested subdomain
    desiredSubdomain = desiredSubdomain.toLowerCase().trim();
    const isValidSubdomain = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(
      desiredSubdomain,
    );

    if (isValidSubdomain && !clients.has(desiredSubdomain)) {
      // Use the requested subdomain if valid and available
      subdomain = desiredSubdomain;
      usedRequestedSubdomain = true;
      logger.info(`Using client-requested subdomain: ${subdomain}`);
    } else {
      // Log why we're not using the requested subdomain
      if (!isValidSubdomain) {
        logger.warning(
          `Requested subdomain "${desiredSubdomain}" is invalid, generating a random one instead`,
        );
      } else {
        logger.warning(
          `Requested subdomain "${desiredSubdomain}" is already in use, generating a random one instead`,
        );
      }
      subdomain = generateSubdomain();
    }
  } else {
    // Generate a random subdomain if none was requested
    subdomain = generateSubdomain();
  }

  return { subdomain, usedRequestedSubdomain };
}

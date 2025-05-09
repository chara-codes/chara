import { humanId } from "human-id";
import type { ServerWebSocket } from "bun";
import type { ClientData } from "../types/server.types";
import { logger } from "@chara/logger";

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
 * Validates a subdomain string against DNS naming rules
 *
 * @param subdomain - The subdomain to validate
 * @returns An object with validation result and optional reason for failure
 */
export function validateSubdomain(subdomain: string): {
  isValid: boolean;
  reason?: string;
} {
  // Check length constraints
  if (subdomain.length < 3) {
    return {
      isValid: false,
      reason: "Subdomain must be at least 3 characters long",
    };
  }

  if (subdomain.length > 63) {
    return {
      isValid: false,
      reason: "Subdomain must be at most 63 characters long",
    };
  }

  // Check for valid characters (lowercase letters, numbers, hyphens)
  if (!/^[a-z0-9-]+$/.test(subdomain)) {
    return {
      isValid: false,
      reason:
        "Subdomain can only contain lowercase letters, numbers, and hyphens",
    };
  }

  // Check it doesn't start or end with a hyphen
  if (subdomain.startsWith("-") || subdomain.endsWith("-")) {
    return {
      isValid: false,
      reason: "Subdomain cannot start or end with a hyphen",
    };
  }

  return { isValid: true };
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
    const [subdomainToCheck = ""] = desiredSubdomain
      .toLowerCase()
      .trim()
      .split(".");

    const validationResult = validateSubdomain(subdomainToCheck);

    if (validationResult.isValid && !clients.has(subdomainToCheck)) {
      // Use the requested subdomain if valid and available
      subdomain = subdomainToCheck;
      usedRequestedSubdomain = true;
      logger.info(`Using client-requested subdomain: ${subdomain}`);
    } else {
      // Log why we're not using the requested subdomain
      if (!validationResult.isValid) {
        logger.warning(
          `Requested subdomain "${desiredSubdomain}" is invalid: ${validationResult.reason}. Generating a random one instead.`,
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
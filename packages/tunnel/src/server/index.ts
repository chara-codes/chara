import { TunnelServer } from "./server";
import { handleOpen, handleMessage, handleClose } from "./handlers";
import { handleConnection } from "./handlers/connection-handler";
import { handleHttpRequest } from "./handlers/http-handler";
import type {
  PendingRequest,
  ClientData,
  ServerConfig,
  TextReplacement,
  ClientMap,
} from "../types/server.types";

export {
  TunnelServer,
  handleHttpRequest,
  handleConnection,
  handleOpen,
  handleMessage,
  handleClose,
};

export type {
  PendingRequest,
  ClientData,
  ServerConfig,
  TextReplacement,
  ClientMap,
};

// Factory function to create a new TunnelServer instance
export function createTunnelServer(config: ServerConfig): TunnelServer {
  return new TunnelServer(config);
}

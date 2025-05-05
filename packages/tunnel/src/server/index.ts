import { TunnelServer } from './server';
import { handleHttpRequest } from './http-handler';
import { handleConnection } from './connection-handler';
import { handleOpen, handleMessage, handleClose } from './handlers';
import type { 
  PendingRequest, 
  ClientData, 
  ServerConfig, 
  TextReplacement, 
  ClientMap 
} from './types';

export {
  TunnelServer,
  handleHttpRequest,
  handleConnection,
  handleOpen,
  handleMessage,
  handleClose
};

export type {
  PendingRequest,
  ClientData,
  ServerConfig,
  TextReplacement,
  ClientMap
};

// Factory function to create a new TunnelServer instance
export function createTunnelServer(config: ServerConfig): TunnelServer {
  return new TunnelServer(config);
}
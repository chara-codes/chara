import { defineExtensionMessaging } from "@webext-core/messaging";

interface ProtocolMap {
  getStringLength(data: string): number;
  ololo(): Promise<unknown>;
}

export const { sendMessage, onMessage } =
  defineExtensionMessaging<ProtocolMap>();

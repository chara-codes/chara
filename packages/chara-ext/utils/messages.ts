import { defineExtensionMessaging } from "@webext-core/messaging";

interface ProtocolMap {
  getStringLength(data: string): number;
  ololo(): string;
}

export const { sendMessage, onMessage } =
  defineExtensionMessaging<ProtocolMap>();

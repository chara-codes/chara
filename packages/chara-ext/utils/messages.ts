import { defineExtensionMessaging } from "@webext-core/messaging";

export interface MessagingProtocolMap {
  getStringLength(data: string): number;
  selectElement(): Promise<unknown>;
}

export const { sendMessage, onMessage } =
  defineExtensionMessaging<MessagingProtocolMap>();

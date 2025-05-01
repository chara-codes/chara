export interface TunnelClientOptions {
  port: number;
  host: string;
  remoteHost: string;
  secure: boolean;
  subdomain?: string;
}
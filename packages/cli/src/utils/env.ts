interface Env {
  publicUrl: string;
  apiUrl: string;
  homeDir: string;
}

export const env = (): Env => ({
  publicUrl: process.env.SERVER_URL as string,
  apiUrl: process.env.API_URL as string,

  homeDir:
    process.platform === "win32"
      ? (process.env.USERPROFILE as string)
      : (process.env.HOME as string),
});

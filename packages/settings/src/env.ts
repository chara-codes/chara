interface Env {
  homeDir: string;
}

export const env = (): Env => ({
  homeDir:
    process.platform === "win32"
      ? (process.env.USERPROFILE as string)
      : (process.env.HOME as string),
});

import { unlinkSync } from "node:fs";
import { resolve } from "node:path";
import { env } from "./env";

interface GlobalConfig {
  env?: Record<string, string>;
  models?: {
    whitelist?: any[];
    customModels?: any[];
  };
  [key: string]: any;
}

export const getPathToGlobalConfig = (file: string = ".chararc") => {
  return resolve(env().homeDir, file);
};

export const readGlobalConfig = async (file: string = ".chararc") => {
  const configPath = getPathToGlobalConfig(file);
  const configFile = Bun.file(configPath);

  if (!(await configFile.exists())) {
    throw new Error(`Config file ${file} does not exist`);
  }

  return await configFile.json();
};

export const writeGlobalConfig = async (
  config: any,
  file: string = ".chararc",
) => {
  const configPath = getPathToGlobalConfig(file);
  const configFile = Bun.file(configPath);

  await Bun.write(configFile, JSON.stringify(config, null, 2));
};

export const updateGlobalConfig = async (
  config: any,
  file: string = ".chararc",
) => {
  const currentConfig = (await existsGlobalConfig(file))
    ? await readGlobalConfig(file)
    : {};
  return await writeGlobalConfig({ ...currentConfig, ...config }, file);
};

export const existsGlobalConfig = async (file: string = ".chararc") => {
  const configPath = getPathToGlobalConfig(file);
  const configFile = Bun.file(configPath);
  return await configFile.exists();
};

export const removeGlobalConfig = async (file: string = ".chararc") => {
  const configPath = getPathToGlobalConfig(file);
  const configFile = Bun.file(configPath);

  if (await configFile.exists()) {
    await Bun.file(configPath).writer().end();
    unlinkSync(configPath);
  }
};

export const getVarFromEnvOrGlobalConfig = async (name: string) => {
  const { env = {} } = await readGlobalConfig();
  return process.env[name] ?? env[name];
};

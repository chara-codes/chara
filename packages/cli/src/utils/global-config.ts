import { resolve } from "node:path";
import { env } from "./env";
import { unlinkSync } from "node:fs";

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

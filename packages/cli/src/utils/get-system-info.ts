import { promises as fs } from "fs";
import path from "path";
import os from "os";

function collectSystemInfo() {
  const systemInfo = {
    operatingSystem: {
      platform: os.platform(),
      release: os.release(),
      type: os.type(),
      version: os.version?.() ?? "N/A",
    },
    cpu: {
      architecture: os.arch(),
      cores: os.cpus().length,
      model: os.cpus()[0]?.model || "Unknown",
    },
    environment: {
      nodeVersion: process.version,
      runtime: detectRuntime(),
      shell: process.env.SHELL || process.env.ComSpec || "Unknown",
      user: os.userInfo().username,
      homeDirectory: os.homedir(),
    }
  };

  return systemInfo;
}

function detectRuntime(): string {
  if (typeof Bun !== "undefined") {
    return `Bun v${Bun.version}`;
  }
  return "Node.js";
}

async function updateCharaJson(systemInfo: Record<string, any>) {
  const charaJsonPath = path.resolve(__dirname, "../../.chara.json");

  try {
    let charaData: Record<string, any> = {};
    try {
      const charaJson = await fs.readFile(charaJsonPath, "utf-8");
      charaData = JSON.parse(charaJson);
    } catch (error) {
      console.error(error);
    }

    charaData.systemContext = systemInfo;

    await fs.writeFile(charaJsonPath, JSON.stringify(charaData, null, 2), "utf-8");
    console.log("Updated .chara.json with systemContext.");
  } catch (error) {
    console.error("Error updating .chara.json:", error);
  }
}

export async function getAndStoreSystemInfo() {
  const systemInfo = collectSystemInfo();
  await updateCharaJson(systemInfo);
}

getAndStoreSystemInfo().catch((error) => {
  console.error("An error occurred:", error);
});
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

export class TestFileSystem {
  private tempDir: string | null = null;

  async setup(): Promise<string> {
    this.tempDir = await mkdtemp(join(tmpdir(), "bun-test-"));
    return this.tempDir;
  }

  async cleanup(): Promise<void> {
    if (this.tempDir) {
      await rm(this.tempDir, { recursive: true, force: true });
      this.tempDir = null;
    }
  }

  getPath(relativePath = ""): string {
    if (!this.tempDir) {
      throw new Error("TestFileSystem not initialized. Call setup() first.");
    }
    return relativePath ? join(this.tempDir, relativePath) : this.tempDir;
  }

  async createFile(path: string, content: string): Promise<string> {
    const fullPath = this.getPath(path);
    await Bun.write(fullPath, content);
    return fullPath;
  }

  async createDir(path: string): Promise<string> {
    const fullPath = this.getPath(path);
    await Bun.write(join(fullPath, ".gitkeep"), "");
    return fullPath;
  }

  async fileExists(path: string): Promise<boolean> {
    try {
      const file = Bun.file(this.getPath(path));
      return await file.exists();
    } catch {
      return false;
    }
  }

  async readFile(path: string): Promise<string> {
    const file = Bun.file(this.getPath(path));
    return await file.text();
  }
}

export const createTestFS = () => new TestFileSystem();

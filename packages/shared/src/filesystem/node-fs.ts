import { promises as fs } from "node:fs";
import {
  basename,
  dirname,
  isAbsolute,
  join,
  relative,
  resolve,
} from "node:path";
import { FileSystem } from "@netlify/build-info";

/**
 * Node.js FileSystem implementation for @netlify/build-info
 *
 * This class provides a complete implementation of the FileSystem interface
 * required by @netlify/build-info to analyze projects in Node.js environments.
 */
export class NodeFS extends FileSystem {
  constructor() {
    super();
    this.cwd = process.cwd();
  }

  getEnvironment() {
    return "node" as any;
  }

  isAbsolute(path: string): boolean {
    return isAbsolute(path);
  }

  dirname(path: string): string {
    return dirname(path);
  }

  resolve(...paths: string[]): string {
    return resolve(...paths);
  }

  relative(from: string, to: string): string {
    return relative(from, to);
  }

  basename(path: string): string {
    return basename(path);
  }

  join(...segments: string[]): string {
    return join(...segments);
  }

  async fileExists(path: string): Promise<boolean> {
    try {
      await fs.stat(resolve(path));
      return true;
    } catch {
      return false;
    }
  }

  async readFile(path: string): Promise<string> {
    return fs.readFile(resolve(path), "utf-8");
  }

  async writeFile(path: string, data: string): Promise<void> {
    return fs.writeFile(resolve(path), data, "utf-8");
  }

  async readdir(path: string): Promise<string[]> {
    return fs.readdir(resolve(path));
  }

  async stat(path: string) {
    return fs.stat(resolve(path));
  }

  // Overloaded readDir method to support both string[] and Record<string, "directory" | "file"> returns
  async readDir(path: string): Promise<string[]>;
  async readDir(
    path: string,
    withFileTypes: true
  ): Promise<Record<string, "directory" | "file">>;
  async readDir(
    path: string,
    withFileTypes?: true
  ): Promise<Record<string, "directory" | "file"> | string[]> {
    try {
      if (!withFileTypes) {
        return await fs.readdir(resolve(path));
      }
      const result = await fs.readdir(resolve(path), { withFileTypes: true });
      return result.reduce(
        (prev, cur) => ({
          ...prev,
          [cur.name]: cur.isDirectory() ? "directory" : "file",
        }),
        {}
      );
    } catch {
      return withFileTypes ? {} : [];
    }
  }
}

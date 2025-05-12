import fs from "fs";
import path from "path";

export function detectWebFramework(
  projectPath: string,
): "next" | "nuxt" | "vite" | "angular" | "static" | null {
  const pkgJsonPath = path.join(projectPath, "package.json");

  if (!fs.existsSync(pkgJsonPath)) {
    const indexHtml = path.join(projectPath, "index.html");
    return fs.existsSync(indexHtml) ? "static" : null;
  }

  const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, "utf-8"));
  const deps = {
    ...pkgJson.dependencies,
    ...pkgJson.devDependencies,
  };

  if (deps["next"]) return "next";
  if (deps["nuxt"]) return "nuxt";
  if (deps["vite"]) return "vite";
  if (deps["@angular/core"]) return "angular";
  if (fs.existsSync(path.join(projectPath, "index.html"))) return "static";

  return null;
}

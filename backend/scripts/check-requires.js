const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");

function scanDir(dir) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      scanDir(fullPath);
    } else if (file.endsWith(".js")) {
      checkFile(fullPath);
    }
  });
}

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");

  const requireRegex = /require\(['"`](.*?)['"`]\)/g;

  let match;
  while ((match = requireRegex.exec(content)) !== null) {
    const requiredPath = match[1];

    if (requiredPath.startsWith(".")) {
      const resolvedPath = path.resolve(path.dirname(filePath), requiredPath);

      try {
        require(resolvedPath);
      } catch (err) {
        if (err.code === "MODULE_NOT_FOUND") {
          console.log(`❌ Broken require in: ${filePath}`);
          console.log(`   → require("${requiredPath}")`);
          console.log("");
        }
      }
    }
  }
}

console.log("🔎 Scanning project for broken require paths...\n");

scanDir(projectRoot);

console.log("✅ Scan complete.");
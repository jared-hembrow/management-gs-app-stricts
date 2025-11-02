import dotenv from "dotenv"
import * as fs from "fs"
dotenv.config()

const SCRIPT_ID = process.env.SCRIPT_ID || "Not found as an env"

const claspJson = {
  "scriptId": SCRIPT_ID,
  "rootDir": "dist",
  "scriptExtensions": [".js", ".gs"],
  "htmlExtensions": [".html"],
  "jsonExtensions": [".json"],
  "filePushOrder": [],
  "skipSubdirectories": false
}
function writeJson(fileName, data) {
    // Write to file
     fs.writeFileSync(fileName, data, "utf-8");
  }

writeJson(".clasp.json", JSON.stringify(claspJson))
// Generates TypeScript types from the synced JSON Schemas (src/contract/types.gen.ts).
import fs from "node:fs"; import path from "node:path"; import { fileURLToPath } from "node:url"; import { compile } from "json-schema-to-typescript";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."); const L = (n) => JSON.parse(fs.readFileSync(path.join(root, "src/contract", n), "utf8"));
let out = "// GENERATED from src/contract/*.schema.json by scripts/gen-types.mjs - do not edit.\n/* eslint-disable */\n";
for (const [file, name] of [["assess_request.schema.json", "AssessRequest"], ["assess_response.schema.json", "AssessResponse"], ["error.schema.json", "ApiErrorBody"]]) {
  const s = L(file); delete s.$schema; delete s.$id; s.title = name; out += (await compile(s, name, { bannerComment: "", additionalProperties: false, unreachableDefinitions: false })) + "\n";
}
fs.writeFileSync(path.join(root, "src/contract/types.gen.ts"), out); console.log("types generated");

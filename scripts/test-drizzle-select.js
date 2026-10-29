import { execSync } from "child_process";

console.log("Testing assessment_templates schema column parsing...");

const output = execSync(
  `npx wrangler d1 execute hris-teachapp-db --remote --json --command="SELECT id, title, schema, typeof(schema) as schema_type FROM assessment_templates;"`,
  { encoding: "utf-8" }
);

console.log("Raw SQL Result:", JSON.parse(output)[0]?.results);

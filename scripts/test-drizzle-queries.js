import { execSync } from "child_process";

console.log("Testing D1 raw data...");

const tOut = execSync(`npx wrangler d1 execute hris-teachapp-db --remote --json --command="SELECT * FROM assessment_templates;"`, { encoding: 'utf-8' });
console.log("Templates:", JSON.parse(tOut)[0]?.results);

const eOut = execSync(`npx wrangler d1 execute hris-teachapp-db --remote --json --command="SELECT id, email, name FROM employees WHERE email LIKE '%huda%';"`, { encoding: 'utf-8' });
console.log("Employees (huda):", JSON.parse(eOut)[0]?.results);

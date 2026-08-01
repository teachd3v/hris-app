const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BUCKET_NAME = 'hris-teachapp-storage';
const BASE_DIR = path.join(__dirname, '..', 'supabase-backup', 'qpxkavtjrewfqhpzftmn');

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

const allFiles = getAllFiles(BASE_DIR);
console.log(`Found ${allFiles.length} files to upload.`);

let successCount = 0;
let errorCount = 0;

for (let i = 0; i < allFiles.length; i++) {
  const filePath = allFiles[i];
  
  const relativePath = path.relative(BASE_DIR, filePath);
  const objectKey = relativePath.replace(/\\/g, '/');
  
  console.log(`[${i + 1}/${allFiles.length}] Uploading ${objectKey}...`);
  
  try {
    const cmd = `npx wrangler r2 object put ${BUCKET_NAME}/${objectKey} --file="${filePath}"`;
    execSync(cmd, { stdio: 'pipe' });
    successCount++;
  } catch (err) {
    console.error(`Failed to upload ${objectKey}:`, err.message);
    errorCount++;
  }
}

console.log(`\nUpload complete! Success: ${successCount}, Failed: ${errorCount}`);

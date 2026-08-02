const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const R2_BUCKET = 'hris-teachapp-storage';
const R2_PUBLIC_BASE = 'https://pub-2d729e2730464d84a7536597000e628a.r2.dev';
const SUPABASE_BASE = 'https://qpxkavtjrewfqhpzftmn.supabase.co/storage/v1/object/public/';

const backupDir = path.join(__dirname, '..', 'supabase-backup', 'qpxkavtjrewfqhpzftmn');

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

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

function uploadToR2(r2Key, localPath) {
  const safeLocalPath = localPath.replace(/\\/g, '/');
  const cmd = `npx wrangler r2 object put ${R2_BUCKET}/${r2Key} --file "${safeLocalPath}" --remote`;
  execSync(cmd, { stdio: 'inherit' });
}

async function main() {
  console.log('--- Step 1: Scanning local backup files ---');
  if (!fs.existsSync(backupDir)) {
    throw new Error(`Backup directory not found at ${backupDir}`);
  }

  const allFiles = getAllFiles(backupDir);
  console.log(`Found ${allFiles.length} files to upload to R2.`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < allFiles.length; i++) {
    const localFilePath = allFiles[i];
    // Calculate R2 key relative to backupDir (e.g. avatars/xyz/image.jpg)
    const relativePath = path.relative(backupDir, localFilePath);
    const r2Key = relativePath.replace(/\\/g, '/');

    console.log(`\n[${i + 1}/${allFiles.length}] Uploading to R2: ${r2Key}`);

    try {
      uploadToR2(r2Key, localFilePath);
      successCount++;
    } catch (err) {
      console.error(`ERROR uploading ${r2Key}:`, err.message);
      failCount++;
    }
  }

  console.log(`\n=== File Upload Summary ===`);
  console.log(`Success: ${successCount}, Failed: ${failCount}`);

  if (successCount > 0) {
    console.log('\n--- Step 2: Updating URLs in Cloudflare D1 Remote Database ---');
    
    const updatePhotoSql = `UPDATE employees SET photo_url = REPLACE(photo_url, '${SUPABASE_BASE}', '${R2_PUBLIC_BASE}/') WHERE photo_url LIKE '${SUPABASE_BASE}%';`;
    const updateDocSql = `UPDATE employee_documents SET file_url = REPLACE(file_url, '${SUPABASE_BASE}', '${R2_PUBLIC_BASE}/') WHERE file_url LIKE '${SUPABASE_BASE}%';`;

    console.log('Executing D1 SQL updates...');
    try {
      execSync(`npx wrangler d1 execute hris-teachapp-db --remote --command "${updatePhotoSql.replace(/"/g, '\\"')}"`, { stdio: 'inherit' });
      execSync(`npx wrangler d1 execute hris-teachapp-db --remote --command "${updateDocSql.replace(/"/g, '\\"')}"`, { stdio: 'inherit' });
      console.log('✅ D1 Database URLs updated successfully!');
    } catch (e) {
      console.error('Failed to update D1 database:', e.message);
    }
  }
}

main().catch(err => {
  console.error('Fatal error during migration:', err);
  process.exit(1);
});

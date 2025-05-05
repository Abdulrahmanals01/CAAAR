const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = process.env.ROOT_DIR || path.resolve(__dirname);
const backupExtensions = [
  '.backup', '.bak', '.backup-', '.bak-', '.pre-', '.update', '.fix', 
  '.temp', '.original', '.old', '.debug', '.cors-fix', '.image-fix', 
  '.scheduler', '.date-fix-backup', '.buttons', '.map', '.integrated'
];

const uselessFiles = [
  'debug-image-functions.js',
  'debug-route.js',
  'debug-uploads.js',
  'test-admin-action.js',
  'test-image-access.js',
  'testRejectExpired.js',
  'switchRole.temp'
];

const protectedDirs = [
  'node_modules',
  'build',
  'dist',
  '.git',
  'uploads'
];

function isBackupFile(filePath) {
  const basename = path.basename(filePath);
  return backupExtensions.some(ext => basename.includes(ext));
}

function isUselessFile(filePath) {
  const basename = path.basename(filePath);
  return uselessFiles.some(file => basename === file);
}

function shouldSkipPath(filePath) {
  return protectedDirs.some(dir => {
    const pathParts = filePath.split(path.sep);
    return pathParts.includes(dir);
  });
}

function removeComments(content) {
  
  content = content.replace(/\/\*[\s\S]*?\*\
  
  
  const lines = content.split('\n');
  const cleanedLines = lines.map(line => {
    
    const commentIndex = line.indexOf('
    if (commentIndex >= 0 && !line.substring(0, commentIndex).includes('http')) {
      return line.substring(0, commentIndex);
    }
    return line;
  });
  
  
  return cleanedLines.join('\n').replace(/\n{3,}/g, '\n\n');
}

function findFilesToProcess(dir, filesToDelete = [], filesToClean = []) {
  if (shouldSkipPath(dir)) {
    return { filesToDelete, filesToClean };
  }

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        
        findFilesToProcess(fullPath, filesToDelete, filesToClean);
      } else if (entry.isFile()) {
        
        if (isBackupFile(fullPath) || isUselessFile(fullPath)) {
          filesToDelete.push(fullPath);
        } 
        
        else if ((fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) && 
                 !shouldSkipPath(fullPath)) {
          filesToClean.push(fullPath);
        }
      }
    }
  } catch (err) {
    console.error(`Error processing directory ${dir}:`, err.message);
  }
  
  return { filesToDelete, filesToClean };
}

function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const cleanedContent = removeComments(content);
    fs.writeFileSync(filePath, cleanedContent, 'utf8');
    console.log(`✓ Removed comments from: ${filePath}`);
    return true;
  } catch (err) {
    console.error(`× Error processing ${filePath}:`, err.message);
    return false;
  }
}

function deleteFile(filePath) {
  try {
    fs.unlinkSync(filePath);
    console.log(`✓ Deleted file: ${filePath}`);
    return true;
  } catch (err) {
    console.error(`× Error deleting ${filePath}:`, err.message);
    return false;
  }
}

console.log('Starting code cleanup process...');
console.log('--------------------------------------');

console.log('Scanning directories for files to process...');
const { filesToDelete, filesToClean } = findFilesToProcess(rootDir);

console.log('--------------------------------------');
console.log(`Found ${filesToDelete.length} backup/useless files to delete`);
console.log(`Found ${filesToClean.length} code files to clean comments from`);
console.log('--------------------------------------');

console.log('Deleting backup and useless files:');
let deletedCount = 0;
for (const file of filesToDelete) {
  if (deleteFile(file)) {
    deletedCount++;
  }
}

console.log('--------------------------------------');
console.log(`Successfully deleted ${deletedCount} of ${filesToDelete.length} files`);
console.log('--------------------------------------');

console.log('Removing comments from code files:');
let cleanedCount = 0;
for (const file of filesToClean) {
  if (processFile(file)) {
    cleanedCount++;
  }
}

console.log('--------------------------------------');
console.log(`Successfully cleaned ${cleanedCount} of ${filesToClean.length} files`);
console.log('--------------------------------------');

console.log('Code cleanup completed!');
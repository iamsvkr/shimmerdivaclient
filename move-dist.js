const fs = require('fs');
const path = require('path');

// 1. Define paths
const source = path.join(__dirname, 'clientApp', 'dist');
const destination = __dirname;

try {
  // 2. Read contents of the dist folder
  const items = fs.readdirSync(source);

  items.forEach(item => {
    const oldPath = path.join(source, item);
    const newPath = path.join(destination, item);

    // 3. Move the item (directory or file)
    // If destination already exists, we remove it first to avoid 'ENOTEMPTY' errors
    if (fs.existsSync(newPath)) {
      fs.rmSync(newPath, { recursive: true, force: true });
    }

    fs.renameSync(oldPath, newPath);
    console.log(`Successfully moved ${item} to root.`);
  });
} catch (err) {
  console.error('Error moving files:', err.message);
}

const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

// Helper function to copy files
function copyStaticFiles(srcDir, destDir) {
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  fs.readdirSync(srcDir).forEach((file) => {
    const srcFile = path.join(srcDir, file);
    const destFile = path.join(destDir, file);
    if (fs.lstatSync(srcFile).isDirectory()) {
      copyStaticFiles(srcFile, destFile);
    } else {
      fs.copyFileSync(srcFile, destFile);
    }
  });
}

// Build process
esbuild.build({
  entryPoints: ['src/js/index.js'],
  bundle: true,
  outfile: 'dist/bundle.js',
  minify: true,
  sourcemap: true,
  target: ['es2020'],
  define: {
    'process.env.NODE_ENV': '"production"',
  },
}).then(() => {
  console.log('Build successful. Copying static files...');
  copyStaticFiles('src', 'dist');
  copyStaticFiles('src/icons', 'dist/icons');
  console.log('Static files copied successfully.');
}).catch(() => process.exit(1));

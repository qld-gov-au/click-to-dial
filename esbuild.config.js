const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');
const babel = require('@babel/core');
const istanbul = require('babel-plugin-istanbul');

// Helper function to copy files
function copyStaticFiles(srcDir, destDir) {
  if (!fs.existsSync(srcDir)) {
    console.warn(`Source directory does not exist: ${srcDir}`);
    return; // Exit early if the source directory does not exist
  }

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
  plugins: [
    {
      name: 'istanbul',
      setup(build) {
        build.onLoad({ filter: /\.js$/ }, async (args) => {
          const source = await fs.promises.readFile(args.path, 'utf8');

          // Skip files without valid filenames
          if (!args.path || typeof args.path !== 'string') {
            console.warn(`Skipping file with invalid path: ${args.path}`);
            return { contents: source, loader: 'js' };
          }

          // Instrument the file for coverage
          const result = babel.transformSync(source, {
            filename: args.path, // Ensure filename is passed
            plugins: [[istanbul, { exclude: ['**/*.test.js', '**/*.spec.js'] }]], // Exclude test files
          });

          // Log files being instrumented for debugging
          console.log(`Instrumenting file for coverage: ${args.path}`);

          return { contents: result.code, loader: 'js' };
        });
      },
    },
  ],
}).then(() => {
  console.log('Build successful. Copying static files...');
  copyStaticFiles('src', 'dist');
  copyStaticFiles('src/images', 'dist/images'); // Updated from 'src/icons' to 'src/images'
  console.log('Static files copied successfully.');
}).catch((error) => {
  console.error('Build failed:', error);
  process.exit(1);
});

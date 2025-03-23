// build.js
const fs = require('fs-extra');
const path = require('path');
const { build } = require('vite');

async function main() {
  console.log('Starting Strapi plugin build for Magic Link...');
  
  try {
    // Clean and prepare dist directory
    await fs.emptyDir(path.resolve(__dirname, 'dist'));
    await fs.ensureDir(path.resolve(__dirname, 'dist/admin'));
    await fs.ensureDir(path.resolve(__dirname, 'dist/server'));

    // Build admin panel
    await build({
      configFile: path.resolve(__dirname, 'vite.config.js'),
      root: path.resolve(__dirname, 'admin/src'),
      build: {
        outDir: path.resolve(__dirname, 'dist/admin'),
        emptyOutDir: true,
        lib: {
          entry: path.resolve(__dirname, 'admin/src/index.js'),
          formats: ['es'],
          fileName: () => 'index.js',
        },
      },
    });

    // Copy server components
    await fs.copy(
      path.resolve(__dirname, 'server/src'),
      path.resolve(__dirname, 'dist/server')
    );

    // Generate minimal package.json
    const packageJson = require('./package.json');
    const distPackageJson = {
      name: packageJson.name,
      version: packageJson.version,
      description: packageJson.description,
      strapi: packageJson.strapi,
      dependencies: packageJson.dependencies,
      files: [
        "admin",
        "server",
        "strapi-admin.js",
        "strapi-server.js"
      ]
    };
    
    await fs.writeJson(
      path.resolve(__dirname, 'dist/package.json'),
      distPackageJson,
      { spaces: 2 }
    );

    // Copy strapi integration files
    await fs.copy(
      path.resolve(__dirname, 'strapi-admin.js'),
      path.resolve(__dirname, 'dist/strapi-admin.js')
    );
    await fs.copy(
      path.resolve(__dirname, 'strapi-server.js'),
      path.resolve(__dirname, 'dist/strapi-server.js')
    );

    console.log('Strapi plugin build completed successfully!');
  } catch (err) {
    console.error('Build failed:', err);
    process.exit(1);
  }
}

main();
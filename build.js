// build.js
const fs = require('fs-extra');
const path = require('path');
const { build } = require('vite');

async function main() {
  console.log('Starting build process for Magic Link plugin...');
  
  try {
    // Stellen Sie sicher, dass das dist-Verzeichnis existiert
    await fs.ensureDir(path.resolve(__dirname, 'dist'));
    await fs.ensureDir(path.resolve(__dirname, 'dist/admin'));
    await fs.ensureDir(path.resolve(__dirname, 'dist/server'));

    // Admin-Build
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

    // Server-Build (kopieren Sie einfach die Dateien)
    await fs.copy(
      path.resolve(__dirname, 'server/src'), 
      path.resolve(__dirname, 'dist/server')
    );

    // Kopieren und Anpassen der package.json für das Dist-Verzeichnis
    const packageJson = require('./package.json');
    
    // Sicherstellen, dass der richtige Plugin-Name verwendet wird
    if (packageJson.strapi && packageJson.strapi.name) {
      console.log(`Setting plugin name to: strapi-plugin-magic-link-v5`);
      packageJson.strapi.name = 'strapi-plugin-magic-link-v5';
    }
    
    // Entferne nicht benötigte Felder für die Dist-Version
    const distPackageJson = {
      ...packageJson,
      scripts: {
        postinstall: "node ./strapi-admin.js postinstall"
      },
      devDependencies: undefined,
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
    
    // Kopieren der strapi-*.js Dateien in dist
    await fs.copy(
      path.resolve(__dirname, 'strapi-admin.js'),
      path.resolve(__dirname, 'dist/strapi-admin.js')
    );
    await fs.copy(
      path.resolve(__dirname, 'strapi-server.js'),
      path.resolve(__dirname, 'dist/strapi-server.js')
    );

    console.log('Build completed successfully!');
  } catch (err) {
    console.error('Build failed:', err);
    process.exit(1);
  }
}

main();
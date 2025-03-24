// build.js
const fs = require('fs-extra');
const path = require('path');
const { build } = require('vite');

async function main() {
  console.log('Starting build process for Magic Link plugin...');
  
  try {
    // Direktes Ausführen ohne Build
    console.log('Plugin wird ohne Build verwendet, da wir direkt auf die Quelldateien verweisen.');
    console.log('Stellen Sie sicher, dass Sie "strapi develop" mit der --watch-admin Option starten.');
    
    // Für Produktionsbuilds können Sie diesen Code aktivieren:
    /*
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
    */

    console.log('Build completed successfully!');
  } catch (err) {
    console.error('Build failed:', err);
    process.exit(1);
  }
}

main(); 
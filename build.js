const { build } = require('vite');
const path = require('path');

async function buildPlugin() {
  try {
    // Admin-Build
    await build({
      root: path.resolve(__dirname, 'admin'),
      build: {
        outDir: path.resolve(__dirname, 'dist/admin'),
        emptyOutDir: true,
      },
    });

    // Server-Dateien kopieren
    const fs = require('fs-extra');
    await fs.copy(
      path.resolve(__dirname, 'server'),
      path.resolve(__dirname, 'dist/server')
    );

    console.log('Plugin-Build erfolgreich abgeschlossen!');
  } catch (err) {
    console.error('Build fehlgeschlagen:', err);
    process.exit(1);
  }
}

buildPlugin();

'use strict';

// Verwenden der Quelldatei direkt während der Entwicklung 
// und der gebauten Datei im Produktionsmodus
module.exports = process.env.NODE_ENV === 'development' 
  ? require('./server/src/index.js')
  : require('./dist/server'); 
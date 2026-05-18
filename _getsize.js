const fs = require('fs');
const buf = fs.readFileSync('images/stage.png');
const w = buf.readUInt32BE(16);
const h = buf.readUInt32BE(20);
console.log('Width:', w, 'Height:', h, 'Ratio:', (w/h).toFixed(3));

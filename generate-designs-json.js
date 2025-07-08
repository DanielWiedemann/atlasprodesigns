const fs = require('fs');
const path = require('path');

const designsDir = path.join(__dirname, 'designs');
const outputFile = path.join(designsDir, 'designs.json');

fs.readdir(designsDir, (err, files) => {
  if (err) throw err;
  const images = files.filter(f => /\.(png|jpe?g|gif|webp)$/i.test(f));
  fs.writeFileSync(outputFile, JSON.stringify(images, null, 2));
  console.log(`Wrote ${images.length} images to ${outputFile}`);
}); 
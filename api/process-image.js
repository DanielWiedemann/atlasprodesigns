import sharp from 'sharp';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageData, filename } = req.body;
    
    if (!imageData || !filename) {
      return res.status(400).json({ error: 'Missing imageData or filename' });
    }

    // Convert base64 to buffer
    const imageBuffer = Buffer.from(imageData.split(',')[1], 'base64');
    
    // Process image with Sharp
    const processedImage = await sharp(imageBuffer)
      .resize(null, 500, { // Resize to max height of 500px, maintain aspect ratio
        withoutEnlargement: true, // Don't enlarge if image is already smaller
        fit: 'inside'
      })
      .webp({ quality: 85 }) // Convert to WebP with 85% quality
      .toBuffer();

    // Convert back to base64
    const processedBase64 = `data:image/webp;base64,${processedImage.toString('base64')}`;
    
    // Generate new filename with .webp extension
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
    const newFilename = `${nameWithoutExt}.webp`;

    res.status(200).json({
      processedImage: processedBase64,
      filename: newFilename,
      originalSize: imageBuffer.length,
      processedSize: processedImage.length
    });

  } catch (error) {
    console.error('Image processing error:', error);
    res.status(500).json({ error: 'Failed to process image' });
  }
} 
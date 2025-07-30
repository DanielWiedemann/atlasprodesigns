# Atlas Pro Designs Gallery

A modern web gallery for showcasing t-shirt designs with admin panel for bulk upload and management.

## Features

### Image Processing
- **Automatic Resizing**: All uploaded images are automatically resized to a maximum height of 500px while maintaining aspect ratio
- **WebP Conversion**: Images are automatically converted to WebP format for optimal compression and performance
- **Smart Quality Optimization**: Quality is automatically adjusted based on original file size:
  - Files > 1MB: 75% quality
  - Files > 500KB: 80% quality
  - Files ≤ 500KB: 85% quality

### Admin Panel
- **Bulk Upload**: Upload multiple images at once with drag & drop support
- **Real-time Processing**: See progress and size reduction statistics during upload
- **Design Management**: Toggle availability status, view ratings, and delete designs
- **Tag Management**: Add, remove, and bulk tag designs with comprehensive tagging system
- **Statistics Dashboard**: View total designs, availability status, and average ratings

### Gallery Features
- **Responsive Design**: Works on desktop and mobile devices
- **Rating System**: Users can rate designs from 1-5 stars
- **Filter Options**: Filter by availability status, ratings, and tags
- **Tag System**: Comprehensive tagging for easy organization and discovery

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_ANON_KEY`: Your Supabase anonymous key

3. Run the development server:
   ```bash
   npm start
   ```

## Deployment

### Vercel
The project is optimized for Vercel deployment. The image processing happens client-side using HTML5 Canvas API, so no additional server resources are needed.

### Supabase
Make sure to create the following in your Supabase project:
- Storage bucket named `designs` with public access
- Database table `designs` with the appropriate schema
- RLS policies configured for your use case

## Image Processing Details

The image processing pipeline:
1. **File Selection**: Supports .webp, .png, .jpg, .jpeg files
2. **Client-side Processing**: Uses HTML5 Canvas API for resizing and WebP conversion
3. **Quality Optimization**: Automatically adjusts WebP quality based on original file size
4. **Size Reduction**: Typically achieves 30-70% file size reduction
5. **Upload**: Processed images are uploaded to Supabase storage

## Tag System

The comprehensive tagging system includes:
1. **Individual Tagging**: Click on designs to select them, then add tags
2. **Bulk Tagging**: Select multiple designs and apply tags to all at once
3. **Tag Suggestions**: Auto-complete with existing tags or create new ones
4. **Tag Removal**: Remove individual tags from designs
5. **Filtering**: Filter designs by tag status (tagged/untagged)
6. **Default Tags**: Pre-loaded with 30+ suggested tags across categories:
   - **Color Themes**: Pastel, Bright, Monochromatic, Dark, Vibrant, Earthy, Neon
   - **Art Styles**: Geometric, Organic, Minimalist, Abstract, Realistic, Cartoon, Tribal
   - **Subjects**: Animals, Nature, Skulls, Fitness, Ocean, Jungle, Fantasy, Mythology
   - **Mood**: Energetic, Serene, Powerful, Mysterious, Playful, Elegant, Bold
   - **Technique**: Tattoo-style, Watercolor, Digital Art, Hand-drawn, Vector

## Admin Access

Access the admin panel at `/admin.html` and enter the 6-digit passcode to manage designs.

## File Structure

```
├── admin.html          # Admin panel interface
├── index.html          # Main gallery page
├── api/                # API endpoints
│   ├── supabase-config.js
│   ├── rate.js
│   └── submit-rating.js
├── designs/            # Design images (legacy)
├── server.js           # Express server
└── package.json        # Dependencies
``` 
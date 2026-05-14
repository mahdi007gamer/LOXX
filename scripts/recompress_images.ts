import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const uploadsDir = path.join(process.cwd(), 'uploads');

async function processImages() {
  if (!fs.existsSync(uploadsDir)) {
    console.log("Uploads directory not found.");
    return;
  }

  const files = fs.readdirSync(uploadsDir);
  console.log(`Found ${files.length} files to process.`);

  for (const file of files) {
    const filePath = path.join(uploadsDir, file);
    const ext = path.extname(file).toLowerCase();

    if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
      try {
        console.log(`Processing ${file}...`);
        const tempPath = filePath + "_tmp";
        
        // We don't know the target, so we'll use a conservative 800px limit for existing images
        // unless they are specifically named (which we can't easily tell).
        // Let's just compress them to save space.
        
        await sharp(filePath)
          .resize(800, null, { withoutEnlargement: true })
          .toFile(tempPath);
          
        fs.unlinkSync(filePath);
        fs.renameSync(tempPath, filePath);
        console.log(`Successfully processed ${file}`);
      } catch (err) {
        console.error(`Error processing ${file}:`, err);
      }
    }
  }
}

processImages().then(() => console.log("Done."));

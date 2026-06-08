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

    if (['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)) {
      try {
        console.log(`Processing ${file}...`);
        const tempPath = filePath + "_tmp";
        const isGif = ext === '.gif';
        
        const image = sharp(filePath, isGif ? { animated: true } : {});
        const metadata = await image.metadata();
        const resizeWidth = (metadata.width && metadata.width > 800) ? 800 : metadata.width;

        let pipeline = image.resize(resizeWidth, null, { withoutEnlargement: true });

        if (isGif) {
          await pipeline.gif().toFile(tempPath);
        } else {
          await pipeline.toFile(tempPath);
        }
          
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

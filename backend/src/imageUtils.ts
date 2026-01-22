import sharp from 'sharp';
import fs from 'fs-extra';
import path from 'path';
import { ORIGINAL_DIR, SMALL_DIR } from './config';

export interface ProcessedImage {
    fileNameOriginal: string;
    fileNameSmall: string;
}

export const processImage = async (file: Express.Multer.File): Promise<ProcessedImage> => {
    // Ensure directories exist
    await fs.ensureDir(ORIGINAL_DIR);
    await fs.ensureDir(SMALL_DIR);

    const timestamp = Date.now();
    const originalName = `${timestamp}-${file.originalname}`;
    // For small version, we force jpg extension since we convert to jpeg
    const smallName = `${timestamp}-small-${path.parse(file.originalname).name}.jpg`;

    const originalPath = path.join(ORIGINAL_DIR, originalName);
    const smallPath = path.join(SMALL_DIR, smallName);

    // Save original
    await fs.move(file.path, originalPath);

    // Generate and save small version
    await sharp(originalPath)
        .rotate()
        .resize(400, 400, { fit: 'outside' })
        .jpeg({ quality: 80 })
        .toFile(smallPath);

    return {
        fileNameOriginal: originalName,
        fileNameSmall: smallName
    };
};

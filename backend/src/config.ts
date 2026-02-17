import path from 'path';

export const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '../../data');

export const FONT_DIR = path.join(DATA_DIR, 'fonts');

export const PHOTOS_DIR = path.join(DATA_DIR, 'photos');
export const TEMP_DIR = path.join(PHOTOS_DIR, 'temp');
export const ORIGINAL_DIR = path.join(PHOTOS_DIR, 'original');
export const SMALL_DIR = path.join(PHOTOS_DIR, 'small');

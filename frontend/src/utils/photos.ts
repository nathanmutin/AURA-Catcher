import exifr from 'exifr';

export const getGPSFromImage = async (file: File): Promise<{ lat: number; lng: number } | null> => {
    try {
        const output = await exifr.gps(file);
        if (output && output.latitude && output.longitude) {
            return { lat: output.latitude, lng: output.longitude };
        }
        return null;
    } catch (err) {
        console.warn('No GPS data found or error parsing EXIF', err);
        return null;
    }
};

export const handleHEIC = async (file: File): Promise<File> => {
    // Premier test pour éviter de charger la librairie inutilement
    if (file.type == 'image/heic' || file.type == 'image/heif' || file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')) {
        const heicToModule = await import('heic-to');
        if (await heicToModule.isHeic(file)) {
            console.log('Converting HEIC to JPEG...');
            const jpeg = await heicToModule.heicTo({
                blob: file,
                type: "image/jpeg",
                quality: 0.8
            });

            return new File([jpeg], file.name.replace(/\.[^/.]+$/, '.jpg'), { type: 'image/jpeg' });
        }
    }
    return file;
}

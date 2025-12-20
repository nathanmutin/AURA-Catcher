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

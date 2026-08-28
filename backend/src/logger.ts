import fs from 'fs';
import path from 'path';
import { LOGS_DIR } from './config';

export async function logAction(message: string): Promise<void> {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    try {
        await fs.promises.appendFile(path.join(LOGS_DIR, 'activity.log'), logMessage + '\n');
    } catch (err) {
        console.error('Failed to write to log file:', err);
    }
}

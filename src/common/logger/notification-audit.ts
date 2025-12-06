import { promises as fs } from 'fs';
import * as path from 'path';

const LOG_DIR = path.join(process.cwd(), 'logs');
const LOG_FILE = path.join(LOG_DIR, 'notifications.log');

export type NotificationLogEntry = {
    timestamp: string;
    type: 'send' | 'token_update' | 'client_event';
    userId?: string;
    tokenMasked?: string;
    status?: 'success' | 'error';
    messageId?: string;
    error?: string;
    meta?: Record<string, unknown>;
};

const ensureDir = async () => {
    try {
        await fs.mkdir(LOG_DIR, { recursive: true });
    } catch (error) {
        // ignore mkdir errors
    }
};

export const appendNotificationLog = async (entry: NotificationLogEntry): Promise<void> => {
    await ensureDir();
    const line = JSON.stringify(entry) + '\n';
    await fs.appendFile(LOG_FILE, line, 'utf8');
};

export const readNotificationLogs = async (limit = 50): Promise<NotificationLogEntry[]> => {
    try {
        const content = await fs.readFile(LOG_FILE, 'utf8');
        const lines = content.trim().split('\n').filter(Boolean);
        const sliced = lines.slice(-limit);
        return sliced
            .map(line => {
                try {
                    return JSON.parse(line) as NotificationLogEntry;
                } catch {
                    return null;
                }
            })
            .filter((item): item is NotificationLogEntry => item !== null);
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            return [];
        }
        throw error;
    }
};

export const maskToken = (token?: string | null): string | undefined => {
    if (!token) return undefined;
    if (token.length <= 12) return token;
    return `${token.slice(0, 8)}...${token.slice(-4)}`;
};

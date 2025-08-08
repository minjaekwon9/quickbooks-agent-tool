import { cookies } from 'next/headers';
import { QBTokens, QBTokenStorage } from './qb-types';

export class CookieTokenStorage implements QBTokenStorage {
    private readonly COOKIE_PREFIX = 'qb_';
    private readonly COOKIE_OPTIONS = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        maxAge: 60 * 60 * 24 * 100, // 100 days
    };

    async saveTokens(userId: string, tokens: QBTokens): Promise<void> {
        const cookieStore = await cookies();
        const tokenData = {
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            realmId: tokens.realmId,
            expires_at: tokens.expires_at?.toISOString(),
        };

        const encodedTokens = Buffer.from(JSON.stringify(tokenData)).toString('base64');
        cookieStore.set(`${this.COOKIE_PREFIX}${userId}`, encodedTokens, this.COOKIE_OPTIONS);
    }

    async getTokens(userId: string): Promise<QBTokens | null> {
        try {
            const cookieStore = await cookies();
            const cookieValue = cookieStore.get(`${this.COOKIE_PREFIX}${userId}`)?.value;

            if (!cookieValue) return null;

            const decodedData = Buffer.from(cookieValue, 'base64').toString('utf8');
            const tokenData = JSON.parse(decodedData);

            return {
                access_token: tokenData.access_token,
                refresh_token: tokenData.refresh_token,
                realmId: tokenData.realmId,
                expires_at: tokenData.expires_at ? new Date(tokenData.expires_at) : undefined
            };
        } catch (error) {
            return null;
        }
    }

    async deleteTokens(userId: string): Promise<void> {
        const cookieStore = await cookies();
        cookieStore.delete(`${this.COOKIE_PREFIX}${userId}`);
    }
}
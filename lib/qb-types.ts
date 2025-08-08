export interface QBTokens {
    access_token: string;
    refresh_token: string;
    realmId: string;
    expires_at?: Date;
}

export interface QBConfig {
    clientId: string;
    clientSecret: string;
    environment: 'sandbox' | 'production';
    redirectUri: string;
}

export interface QBTokenStorage {
    saveTokens(userId: string, tokens: QBTokens): Promise<void>;
    getTokens(userId: string): Promise<QBTokens | null>;
    deleteTokens(userId: string): Promise<void>;
}
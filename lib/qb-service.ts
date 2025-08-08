const QuickBooks = require('node-quickbooks');
const OAuthClient = require('intuit-oauth');
import { QBTokens, QBConfig, QBTokenStorage } from './qb-types';
import { CookieTokenStorage } from './qb-tokenstorage';

export class QuickBooksService {
    private config: QBConfig;
    private qbo: any;
    private tokenStorage: QBTokenStorage;

    constructor(tokenStorage?: QBTokenStorage) {
        this.config = {
            clientId: process.env.QB_CLIENT_ID!,
            clientSecret: process.env.QB_CLIENT_SECRET!,
            environment: process.env.QB_ENVIRONMENT as 'sandbox' | 'production',
            redirectUri: process.env.QB_REDIRECT_URI!
        };
        this.tokenStorage = tokenStorage || new CookieTokenStorage();
    }

    // Initialize with stored tokens
    async initialize(userId: string): Promise<void> {
        const tokens = await this.tokenStorage.getTokens(userId);
        if (!tokens) {
            throw new Error('No tokens found for user');
        }

        // Refresh token if expired
        if (tokens.expires_at && tokens.expires_at < new Date()) {
            const refreshedTokens = await this.refreshToken(tokens.refresh_token, tokens.realmId);
            await this.tokenStorage.saveTokens(userId, refreshedTokens);
            this.initializeClient(refreshedTokens);
        } else {
            this.initializeClient(tokens);
        }
    }

    // Initialize QB client
    private initializeClient(tokens: QBTokens): void {
        const useSandbox = this.config.environment === 'sandbox';

        this.qbo = new QuickBooks(
            this.config.clientId,
            this.config.clientSecret,
            tokens.access_token,
            false,  // token secret (not needed for OAuth2)
            tokens.realmId,
            useSandbox,
            true,   // enable debugging
            null,   // null for latest version
            '2.0',  // OAuth version
            tokens.refresh_token
        );
    }

    // Refresh access token
    private async refreshToken(refreshToken: string, realmId: string): Promise<QBTokens> {
        const oauthClient = new OAuthClient({
            clientId: this.config.clientId,
            clientSecret: this.config.clientSecret,
            environment: this.config.environment,
            redirectUri: this.config.redirectUri,
        });

        const authResponse = await oauthClient.refreshUsingToken(refreshToken);
        const tokens = authResponse.getJson();

        return {
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            realmId: realmId,
            expires_at: new Date(Date.now() + tokens.expires_in * 1000)
        };
    }

    // Save tokens after OAuth
    async saveTokensFromOAuth(userId: string, tokens: QBTokens): Promise<void> {
        await this.tokenStorage.saveTokens(userId, tokens);
    }

    // Get company name
    async getCompanyName(): Promise<string> {
        return new Promise((resolve, reject) => {
            this.qbo.getCompanyInfo(this.qbo.realmId, (err: any, companyInfo: any) => {
                if (err) {
                    reject(err);
                } else {
                    // Extract just the company name from the response
                    const companyName = companyInfo?.CompanyName;
                    resolve(companyName);
                }
            });
        });
    }
}

export default QuickBooksService;
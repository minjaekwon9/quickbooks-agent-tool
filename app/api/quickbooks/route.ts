import { NextResponse } from 'next/server';
const OAuthClient = require('intuit-oauth');

// Server Action via route handler
export async function GET() {
    const oauthClient = new OAuthClient({
        // Environment variables for QuickBooks OAuth
        clientId: process.env.QB_CLIENT_ID!,
        clientSecret: process.env.QB_CLIENT_SECRET!,
        environment: process.env.QB_ENVIRONMENT as 'sandbox' | 'production',
        redirectUri: process.env.QB_REDIRECT_URI!,
    });

    // Generate the auth URI
    const authUri = oauthClient.authorizeUri({
        scope: [OAuthClient.scopes.Accounting, OAuthClient.scopes.OpenId],
        state: "authorize",
    });

    return NextResponse.json({ authUri });
}
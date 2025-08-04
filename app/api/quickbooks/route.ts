import { NextResponse } from 'next/server';
const OAuthClient = require('intuit-oauth');

// Environment variables for QuickBooks OAuth
const CLIENT_ID = process.env.QB_CLIENT_ID!;
const CLIENT_SECRET = process.env.QB_CLIENT_SECRET!;
const ENVIRONMENT = process.env.QB_ENVIRONMENT!;
const REDIRECT_URI = process.env.QB_REDIRECT_URI!;

// app/api/quickbooks/route.tsx (Server Action via route handler)
export async function GET() {
    const oauthClient = new OAuthClient({
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
        environment: ENVIRONMENT,
        redirectUri: REDIRECT_URI,
    });

    // Generate the auth URI
    const authUri = oauthClient.authorizeUri({
        scope: [OAuthClient.scopes.Accounting, OAuthClient.scopes.OpenId],
        state: "Connect",
    });

    return NextResponse.json({ authUri });
}
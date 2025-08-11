const OAuthClient = require('intuit-oauth');
import { NextRequest, NextResponse } from 'next/server';
import { QuickBooksService } from '@/lib/qb-service';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const queryParams = Object.fromEntries(url.searchParams.entries());

  // TODO: Validate state
  const { code, state, realmId } = queryParams;

  // Check if code and realmId are present
  if (!code || !realmId)
    return NextResponse.json({ error: 'Missing code or realmId' }, { status: 400 });

  const oauthClient = new OAuthClient({
    // Environment variables for QuickBooks OAuth
    clientId: process.env.QB_CLIENT_ID!,
    clientSecret: process.env.QB_CLIENT_SECRET!,
    environment: process.env.QB_ENVIRONMENT as 'sandbox' | 'production',
    redirectUri: process.env.QB_REDIRECT_URI!,
  });

  try {
    // Exchange the code for tokens
    const tokenResponse = await oauthClient.createToken(req.url);
    const tokens = tokenResponse.getJson();

    // Prepare tokens for storage
    const tokenData = {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      realmId: realmId,
      expires_at: new Date(Date.now() + (tokens.expires_in * 1000))
    };

    // Save tokens using QuickBooksService
    const qbService = new QuickBooksService();
    const userId = 'default_user';  // TODO: Replace with a user ID from session or context
    await qbService.saveTokensFromOAuth(userId, tokenData);

    return NextResponse.redirect(new URL('/connect?success=true', req.url));
  } catch (err: any) {
    console.error('Token exchange failed:', err.message);

    return NextResponse.redirect(new URL('/connect?error=token_exchange_failed', req.url));
  }
}
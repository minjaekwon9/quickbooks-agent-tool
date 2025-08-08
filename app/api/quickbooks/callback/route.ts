import { NextRequest, NextResponse } from 'next/server';
const OAuthClient = require('intuit-oauth');
import { QuickBooksService } from '@/lib/qb-service';

// Environment variables for QuickBooks OAuth
const CLIENT_ID = process.env.QB_CLIENT_ID!;
const CLIENT_SECRET = process.env.QB_CLIENT_SECRET!;
const ENVIRONMENT = process.env.QB_ENVIRONMENT!;
const REDIRECT_URI = process.env.QB_REDIRECT_URI!;

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const queryParams = Object.fromEntries(url.searchParams.entries());

  // TODO: Validate state
  const { code, state, realmId } = queryParams;

  // Check if code and realmId are present
  if (!code || !realmId)
    return NextResponse.json({ error: 'Missing code or realmId' }, { status: 400 });

  const oauthClient = new OAuthClient({
    clientId: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
    environment: ENVIRONMENT,
    redirectUri: REDIRECT_URI,
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
    const userId = 'default_user'; // Replace with actual user ID from session/auth
    await qbService.saveTokensFromOAuth(userId, tokenData);

    // Log success (remove in production)
    console.log('Token exchange successful:', {
      access_token: tokens.access_token ? 'present' : 'missing',
      refresh_token: tokens.refresh_token ? 'present' : 'missing',
      realmId: realmId,
      expires_in: tokens.expires_in
    });

    // Test the connection by getting company info
    try {
      await qbService.initialize(userId);
      const companyName = await qbService.getCompanyName();
      console.log('Company connected:', companyName);
    } catch (testError) {
      console.error('Failed to test connection:', testError);
    }

    return NextResponse.redirect(new URL('/connect?success=true', req.url));
  } catch (err: any) {
    console.error('Token exchange failed:', {
      error: err.message,
      fault: err.fault,
      intuit_tid: err.intuit_tid
    });

    return NextResponse.redirect(new URL('/connect?error=token_exchange_failed', req.url));
  }
}
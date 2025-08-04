import { NextRequest, NextResponse } from 'next/server';
const OAuthClient = require('intuit-oauth');

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

    return NextResponse.redirect(new URL('/connect?success=true', req.url));
  } catch (err: any) {
    return NextResponse.json({
      error: 'Failed to exchange token',
      details: err.message
    }, { status: 500 });
  }
}
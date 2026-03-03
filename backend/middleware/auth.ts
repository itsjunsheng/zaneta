import { createClient } from '@supabase/supabase-js';
import { NextFunction, Request, Response } from 'express';

let cachedAuthClient: ReturnType<typeof createClient> | null = null;

const getAuthClient = (): ReturnType<typeof createClient> | null => {
  if (cachedAuthClient) {
    return cachedAuthClient;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  cachedAuthClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return cachedAuthClient;
};

const bearerTokenFrom = (headerValue: string | undefined): string | null => {
  if (!headerValue) {
    return null;
  }

  const [scheme, token] = headerValue.split(' ');
  if (!scheme || !token || scheme.toLowerCase() !== 'bearer') {
    return null;
  }

  return token;
};

export const requireAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authClient = getAuthClient();
  if (!authClient) {
    res.status(500).json({
      error: 'Supabase auth is not configured. Missing SUPABASE_URL or SUPABASE_ANON_KEY.',
    });
    return;
  }

  const accessToken = bearerTokenFrom(req.header('authorization'));
  if (!accessToken) {
    res.status(401).json({ error: 'Missing Bearer token.' });
    return;
  }

  const { data, error } = await authClient.auth.getUser(accessToken);
  if (error || !data.user) {
    res.status(401).json({ error: 'Invalid or expired access token.' });
    return;
  }

  res.locals.userId = data.user.id;
  res.locals.userEmail = data.user.email ?? null;
  next();
};

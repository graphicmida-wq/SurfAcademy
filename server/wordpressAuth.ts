import jwt from "jsonwebtoken";
import { storage } from "./storage";

const JWT_SECRET = process.env.JWT_SECRET;
const WORDPRESS_URL = process.env.WORDPRESS_URL;

if (!JWT_SECRET) {
  console.error("CRITICAL: JWT_SECRET environment variable is not set. SSO will not work.");
}

if (!WORDPRESS_URL) {
  console.error("WARNING: WORDPRESS_URL environment variable is not set. Direct login will not work.");
}

export interface WordPressJWTPayload {
  sub: string;
  email: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  avatar?: string;
  iat: number;
  exp: number;
}

export interface WordPressLoginResponse {
  token: string;
  user_email: string;
  user_nicename: string;
  user_display_name: string;
}

export async function verifyWordPressJWT(token: string): Promise<WordPressJWTPayload | null> {
  if (!JWT_SECRET) {
    console.error("JWT_SECRET not configured - cannot verify tokens");
    return null;
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as unknown as WordPressJWTPayload;
    return decoded;
  } catch (error) {
    console.error("JWT verification failed:", error);
    return null;
  }
}

export async function loginWithWordPressCredentials(
  email: string,
  password: string
): Promise<{ success: boolean; user?: any; error?: string }> {
  if (!WORDPRESS_URL) {
    console.error("WORDPRESS_URL not configured - cannot authenticate");
    return { success: false, error: "Sistema di autenticazione non configurato" };
  }
  
  try {
    const response = await fetch(`${WORDPRESS_URL}/wp-json/jwt-auth/v1/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: email,
        password: password,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("WordPress login failed:", errorData);
      return { 
        success: false, 
        error: errorData.message || "Credenziali non valide" 
      };
    }

    const wpData: WordPressLoginResponse = await response.json();
    
    const wpUserResponse = await fetch(`${WORDPRESS_URL}/wp-json/wp/v2/users/me`, {
      headers: {
        "Authorization": `Bearer ${wpData.token}`,
      },
    });

    let wpUser: any = null;
    if (wpUserResponse.ok) {
      wpUser = await wpUserResponse.json();
    }

    const userId = `wp_${wpUser?.id || email.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const nameParts = wpData.user_display_name?.split(' ') || [];
    
    const user = await storage.upsertUser({
      id: userId,
      email: wpData.user_email,
      firstName: wpUser?.first_name || nameParts[0] || null,
      lastName: wpUser?.last_name || nameParts.slice(1).join(' ') || null,
      profileImageUrl: wpUser?.avatar_urls?.['96'] || null,
    });

    return { success: true, user };
  } catch (error) {
    console.error("WordPress authentication error:", error);
    return { success: false, error: "Errore di connessione con WordPress" };
  }
}

export async function handleSSOLogin(token: string): Promise<{ success: boolean; user?: any; error?: string }> {
  const payload = await verifyWordPressJWT(token);
  
  if (!payload) {
    return { success: false, error: "Token non valido o scaduto" };
  }

  try {
    const userId = `wp_${payload.sub}`;
    const user = await storage.upsertUser({
      id: userId,
      email: payload.email,
      firstName: payload.firstName || null,
      lastName: payload.lastName || null,
      profileImageUrl: payload.avatar || null,
    });

    return { success: true, user };
  } catch (error) {
    console.error("SSO user creation error:", error);
    return { success: false, error: "Errore durante la creazione dell'utente" };
  }
}

export function generateJWTForUser(userId: string, email: string, options?: {
  firstName?: string;
  lastName?: string;
  avatar?: string;
}): string | null {
  if (!JWT_SECRET) {
    console.error("JWT_SECRET not configured - cannot generate tokens");
    return null;
  }
  
  const payload: Omit<WordPressJWTPayload, 'iat' | 'exp'> = {
    sub: userId,
    email,
    firstName: options?.firstName,
    lastName: options?.lastName,
    avatar: options?.avatar,
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

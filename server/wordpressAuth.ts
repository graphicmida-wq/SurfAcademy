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
    const wpUrl = `${WORDPRESS_URL}/wp-json/jwt-auth/v1/token`;
    console.log(`[WP Login] Attempting login for ${email} via ${wpUrl}`);
    
    const response = await fetch(wpUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: email,
        password: password,
      }),
    });

    const responseText = await response.text();
    console.log(`[WP Login] Response status: ${response.status}, body preview: ${responseText.substring(0, 200)}`);

    if (!response.ok) {
      let errorData: any = {};
      try {
        errorData = JSON.parse(responseText);
      } catch (e) {
        console.error("[WP Login] Non-JSON error response:", responseText.substring(0, 500));
        return { success: false, error: "WordPress ha restituito una risposta non valida" };
      }
      
      const wpMessage = (errorData.message || "").replace(/<[^>]*>/g, '').trim();
      const wpCode = errorData.code || "";
      console.error("[WP Login] Error code:", wpCode, "message:", wpMessage);
      
      if (wpCode.includes("llla")) {
        return { success: false, error: "Troppi tentativi di login. Riprova tra qualche minuto." };
      }
      if (wpMessage.includes("incorrect") || wpMessage.includes("Invalid") || wpCode.includes("invalid")) {
        return { success: false, error: "Email o password non corretti" };
      }
      return { 
        success: false, 
        error: wpMessage || "Credenziali non valide" 
      };
    }

    let wpData: WordPressLoginResponse;
    try {
      wpData = JSON.parse(responseText);
    } catch (e) {
      console.error("[WP Login] Failed to parse success response:", responseText.substring(0, 500));
      return { success: false, error: "Risposta non valida da WordPress" };
    }
    
    const wpUserResponse = await fetch(`${WORDPRESS_URL}/wp-json/wp/v2/users/me`, {
      headers: {
        "Authorization": `Bearer ${wpData.token}`,
      },
    });

    let wpUser: any = null;
    if (wpUserResponse.ok) {
      wpUser = await wpUserResponse.json();
    } else {
      console.warn(`[WP Login] Failed to fetch user profile: ${wpUserResponse.status}`);
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
  } catch (error: any) {
    console.error("[WP Login] Connection error:", error?.message || error, "URL:", WORDPRESS_URL);
    return { success: false, error: "Impossibile contattare WordPress. Riprova tra qualche istante." };
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

// lib/auth.ts
import "server-only";

/**
 * En prod : remplace par la lecture de l'auth (Supabase Auth/JWT).
 * En dev/local : on retourne un user_id fixe pour toutes les routes.
 */
export function getUserIdOrDev() {
  // 1) Si tu as déjà une auth, récupère-la ici (ex: cookies/JWT) puis retourne l'ID
  // const authUserId = ...
  // if (authUserId) return authUserId;

  // 2) Fallback dev
  const DEV_ID =
    process.env.DEV_USER_ID ?? "11111111-1111-1111-1111-111111111111";
  return DEV_ID;
}

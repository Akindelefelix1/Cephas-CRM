import { createInternalNeonAuth } from "@neon/neon-js/auth";

const authUrl = import.meta.env.VITE_NEON_AUTH_URL;

if (!authUrl) {
  throw new Error("VITE_NEON_AUTH_URL must be configured to use Neon Auth.");
}

const neonAuth = createInternalNeonAuth(authUrl);
export const authClient = neonAuth.adapter;
export const getAuthToken = () => neonAuth.getJWTToken();

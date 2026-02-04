// Token Manager Utility for handling access and refresh tokens
import Cookies from 'js-cookie';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const TOKEN_EXPIRY_KEY = 'token_expiry';

export const TokenManager = {
  // Set both access and refresh tokens
  setTokens(accessToken, refreshToken) {
    if (typeof window === 'undefined') return;

    // Store access token in localStorage (short-lived, 15min)
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);

    // Calculate and store expiry time (14 minutes to refresh before actual expiry)
    const expiryTime = Date.now() + (14 * 60 * 1000); // 14 minutes
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());

    // Store refresh token in HttpOnly-like cookie (7 days)
    // Note: For true HttpOnly, this should be set by the server
    // For now, we'll use secure cookie with SameSite
    Cookies.set(REFRESH_TOKEN_KEY, refreshToken, {
      expires: 7, // 7 days
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
  },

  // Get access token
  getAccessToken() {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },

  // Get refresh token
  getRefreshToken() {
    if (typeof window === 'undefined') return null;
    return Cookies.get(REFRESH_TOKEN_KEY);
  },

  // Check if access token is expired or about to expire
  isTokenExpired() {
    if (typeof window === 'undefined') return true;

    const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
    if (!expiry) return true;

    return Date.now() >= parseInt(expiry);
  },

  // Clear all tokens
  clearTokens() {
    if (typeof window === 'undefined') return;

    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
    Cookies.remove(REFRESH_TOKEN_KEY);
  },

  // Get time until token expiry (in milliseconds)
  getTimeUntilExpiry() {
    if (typeof window === 'undefined') return 0;

    const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
    if (!expiry) return 0;

    const timeLeft = parseInt(expiry) - Date.now();
    return timeLeft > 0 ? timeLeft : 0;
  }
};

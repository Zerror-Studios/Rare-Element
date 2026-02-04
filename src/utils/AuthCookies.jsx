import { TokenManager } from "./tokenManager";

export const AuthCookies = {
  set(token) {
    // For legacy support, we only handle the access token part here
    // But ideally components should use TokenManager.setTokens(access, refresh)
    localStorage.setItem("access_token", token);
  },
  get() {
    return TokenManager.getAccessToken();
  },
  remove() {
    TokenManager.clearTokens();
  }
};


/**
 * API Configuration
 * Base URL for Django backend API
 */

// For Android emulator, use 10.0.2.2 to access localhost
// For iOS simulator, use localhost
// For physical devices, use your computer's IP address

export const API_CONFIG = {
  BASE_URL: __DEV__
    ? 'http://10.0.2.2:8000' // Android emulator
    : 'https://api.fordhamswipeshare.com', // Production URL (to be configured)

  // Alternative URLs for different environments
  IOS_SIMULATOR_URL: 'http://localhost:8000',
  ANDROID_EMULATOR_URL: 'http://10.0.2.2:8000',

  // API Endpoints
  ENDPOINTS: {
    // Auth
    REGISTER: '/api/auth/register/',
    LOGIN: '/api/auth/login/',
    LOGOUT: '/api/auth/logout/',
    VERIFY_EMAIL: '/api/auth/verify-email/',
    RESEND_VERIFICATION: '/api/auth/resend-verification/',
    REFRESH_TOKEN: '/api/auth/refresh/',
    ME: '/api/auth/me/',
    CHANGE_PASSWORD: '/api/auth/change-password/',
    USER_STATS: '/api/auth/stats/',

    // Swipes
    SWIPE_LISTINGS: '/api/swipes/listings/',
    SWIPE_MATCHES: '/api/swipes/matches/',
    MY_LISTINGS: '/api/swipes/listings/my-listings/',
    MY_MATCHES: '/api/swipes/matches/my-matches/',
    SWIPE_STATS: '/api/swipes/listings/stats/',

    // Forum
    POSTS: '/api/forum/posts/',
    COMMENTS: '/api/forum/comments/',
    MY_POSTS: '/api/forum/posts/my-posts/',
    MY_COMMENTS: '/api/forum/comments/my-comments/',
    POST_STATS: '/api/forum/posts/stats/',

    // Moderation
    REPORTS: '/api/moderation/reports/',
    MY_REPORTS: '/api/moderation/reports/my-reports/',
    MODERATION_ACTIONS: '/api/moderation/actions/',
  },

  // Request timeout
  TIMEOUT: 10000, // 10 seconds
};

/**
 * Get the appropriate base URL based on platform
 */
export const getBaseURL = (): string => {
  if (__DEV__) {
    // In development, use platform-specific URLs
    return API_CONFIG.ANDROID_EMULATOR_URL; // Default to Android
  }
  return API_CONFIG.BASE_URL;
};

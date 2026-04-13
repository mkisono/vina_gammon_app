import { defineAuth } from '@aws-amplify/backend';

/**
 * Authentication configuration with email OTP
 * - Email-based authentication with OTP (One-Time Password)
 * - Refresh token: 365 days (1 year)
 * - Cognito groups: ADMIN group for authorization
 */
export const auth = defineAuth({
  loginWith: {
    email: {
      otpLogin: true,
    },
  },
  accountRecovery: 'EMAIL_ONLY',
  passwordlessOptions: {
    preferredChallenge: 'EMAIL_OTP',
  },
});

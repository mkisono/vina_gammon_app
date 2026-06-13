import { defineAuth } from '@aws-amplify/backend';

/**
 * Authentication configuration during migration period
 * - Email-based OTP remains enabled for existing users
 * - Password sign-in is preferred
 * - Passkey (WebAuthn) sign-in is enabled as an optional method
 * - Refresh token: 365 days (1 year)
 * - Cognito groups: ADMIN group for authorization
 */
export const auth = defineAuth({
  loginWith: {
    email: {
      otpLogin: true,
    },
    webAuthn: true,
  },
  accountRecovery: 'EMAIL_ONLY',
  passwordlessOptions: {
    preferredChallenge: 'PASSWORD',
  },
});

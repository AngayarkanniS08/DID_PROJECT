import * as OTPAuth from 'otpauth';

export class TOTPService {
  /**
   * Generates a 6-digit TOTP code based on a secret.
   * Defaults to 30-second intervals (standard).
   */
  static generateCode(secret: string): string {
    try {
      if (!secret) return '000000';
      const totp = new OTPAuth.TOTP({
        issuer: 'SecureVerify',
        label: 'StudentIdentity',
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: secret,
      });
      return totp.generate();
    } catch (error) {
      console.warn('TOTP Generation failed (Malformed secret):', error);
      return '000000';
    }
  }

  /**
   * Returns the seconds remaining in the current 30s window.
   * Useful for the UI progress bar.
   */
  static getSecondsRemaining(): number {
    return 30 - (Math.floor(Date.now() / 1000) % 30);
  }
}

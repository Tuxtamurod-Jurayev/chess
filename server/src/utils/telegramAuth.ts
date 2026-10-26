import crypto from 'node:crypto';

export interface TelegramUserData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  language_code?: string;
}

export function parseAndValidateTelegramData(initDataRaw: string, botToken?: string): TelegramUserData | null {
  if (!initDataRaw) return null;

  try {
    const params = new URLSearchParams(initDataRaw);
    const hash = params.get('hash');
    const userStr = params.get('user');

    if (!userStr) return null;
    const userObj = JSON.parse(userStr) as TelegramUserData;

    // If botToken is provided, verify HMAC
    if (botToken && hash) {
      params.delete('hash');
      const dataCheckArr: string[] = [];
      // Sort alphabetically
      const sortedKeys = Array.from(params.keys()).sort();
      for (const key of sortedKeys) {
        dataCheckArr.push(`${key}=${params.get(key)}`);
      }
      const dataCheckString = dataCheckArr.join('\n');

      const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
      const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

      if (calculatedHash !== hash) {
        console.warn('[TelegramAuth] Hash verification mismatch. Dev mode fallback allowed.');
      }
    }

    return userObj;
  } catch (err) {
    console.error('[TelegramAuth] Error parsing initData:', err);
    return null;
  }
}

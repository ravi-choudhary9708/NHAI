import { SYNC_SERVER } from '../constants/config';

export const logToServer = async (type, data) => {
  try {
    const payload = typeof data === 'string' ? { message: data } : data;
    await fetch(`${SYNC_SERVER}/api/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, ...payload })
    });
  } catch (e) {
    // Ignore network errors for logging
  }
};

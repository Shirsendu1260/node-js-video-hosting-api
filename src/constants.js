export const DB_NAME = 'node-video-hosting-backend';
export const DATA_LIMIT = '16kb';
export const SALT_ROUNDS = 10;
export const COOKIE_SEND_OPTIONS = {
    httpOnly: true,  // Cookie not accessible via JavaScript in browser
    secure: true     // Cookie only sent over HTTPS
};
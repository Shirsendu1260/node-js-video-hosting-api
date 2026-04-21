export const DB_NAME = "node-video-hosting-backend";
export const DATA_LIMIT = "16kb";
export const SALT_ROUNDS = 10;
export const UPLOAD_DIR = '/tmp/uploads';
export const COOKIE_SEND_OPTIONS = {
    httpOnly: true,  // Cookie not accessible via JavaScript in browser
    secure: true     // Cookie only sent over HTTPS
} as const;

// 'as const' freezes the entire object - makes all values readonly and literal typed
// Without 'as const': TypeScript infers type as { httpOnly: boolean, secure: boolean }
// With 'as const':    TypeScript infers type as { readonly httpOnly: true, readonly secure: true }
// 'true' = literal type, means ONLY true, never false
// This means the values can NEVER be changed anywhere in the codebase
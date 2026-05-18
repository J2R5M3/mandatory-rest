const fs = require('fs');

const loginPath = 'src/pages/api/auth/login.ts';
let loginContent = fs.readFileSync(loginPath, 'utf8');
loginContent = loginContent.replace(
  "const redirectUri = new URL('/api/auth/callback', url.origin).toString();",
  "// Handle proxied requests in production where url.origin might be incorrect\n\tconst host = request.headers.get('x-forwarded-host') || request.headers.get('host') || url.host;\n\tconst protocol = request.headers.get('x-forwarded-proto') || (url.protocol.includes('https') ? 'https' : 'http');\n\tconst origin = `${protocol}://${host}`;\n\tconst redirectUri = new URL('/api/auth/callback', origin).toString();"
);
fs.writeFileSync(loginPath, loginContent);

const callbackPath = 'src/pages/api/auth/callback.ts';
let callbackContent = fs.readFileSync(callbackPath, 'utf8');
callbackContent = callbackContent.replace(
  "const redirectUri = new URL('/api/auth/callback', url.origin).toString();",
  "const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || url.host;\n\tconst protocol = request.headers.get('x-forwarded-proto') || (url.protocol.includes('https') ? 'https' : 'http');\n\tconst origin = `${protocol}://${host}`;\n\tconst redirectUri = new URL('/api/auth/callback', origin).toString();"
);
fs.writeFileSync(callbackPath, callbackContent);

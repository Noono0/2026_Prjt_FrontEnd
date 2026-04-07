import crypto from "node:crypto";

const hex = (n) => crypto.randomBytes(n).toString("hex");

const nextAuthSecret = hex(32);
const oauthSyncSecret = hex(32);

console.log("# 아래 두 줄을 .env.production.local / 호스팅 환경변수에 넣으세요.");
console.log("# OAUTH_SYNC_SECRET 은 백엔드 application.yml 의 app.oauth-sync.secret 과 반드시 동일해야 합니다.\n");
console.log(`NEXTAUTH_SECRET=${nextAuthSecret}`);
console.log(`OAUTH_SYNC_SECRET=${oauthSyncSecret}`);

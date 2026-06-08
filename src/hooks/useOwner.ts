// owner 解決は OwnerContext に集約（Clerk 直依存を避け、キー未設定/オフラインでも動作）。
export { useOwner } from '../services/auth/ownerContext.js';
export type { OwnerState } from '../services/auth/ownerContext.js';

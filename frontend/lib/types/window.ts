/**
 * Global Window type extensions for TalentChain Pro
 */

declare global {
  interface Window {
    ethereum?: Record<string, unknown>;
    hashconnect?: Record<string, unknown>;
  }
}

export {};

import type { Persistence } from 'firebase/auth';

// O firebase/auth só exporta getReactNativePersistence no build "react-native" (que o Metro usa),
// mas os tipos publicados não declaram a função.
declare module 'firebase/auth' {
  export function getReactNativePersistence(storage: {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
    removeItem(key: string): Promise<void>;
  }): Persistence;
}

import * as SecureStore from 'expo-secure-store';

import type { Session } from '../../domain/entities/Session';

const SESSION_KEY = 'auth.session';

export interface SessionStorage {
  save(session: Session): Promise<void>;
  load(): Promise<Session | null>;
  clear(): Promise<void>;
}

/**
 * La sesión (JWT incluido) vive solo en expo-secure-store: Keychain en iOS y Keystore en Android.
 * Nunca en AsyncStorage (MASVS-STORAGE). No se sincroniza a iCloud ni a otros dispositivos.
 */
export class SecureSessionStorage implements SessionStorage {
  private readonly options: SecureStore.SecureStoreOptions = {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  };

  async save(session: Session): Promise<void> {
    await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session), this.options);
  }

  async load(): Promise<Session | null> {
    const raw = await SecureStore.getItemAsync(SESSION_KEY, this.options);
    if (!raw) return null;
    try {
      const session = JSON.parse(raw) as Session;
      return session?.token && session.user ? session : null;
    } catch {
      return null;
    }
  }

  async clear(): Promise<void> {
    await SecureStore.deleteItemAsync(SESSION_KEY, this.options);
  }
}

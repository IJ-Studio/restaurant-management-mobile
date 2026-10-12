import * as SecureStore from 'expo-secure-store';

import type { Session } from '../../domain/entities/Session';
import type { SessionStorage } from '../../domain/repositories/SessionStorage';

const KEY = 'auth.session';

// Keychain/Keystore cifrado, sin respaldo en la nube y sin migrar a otro dispositivo (MASVS-STORAGE).
export const SECURE_STORE_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

export class SecureSessionStorage implements SessionStorage {
  async save(session: Session): Promise<void> {
    await SecureStore.setItemAsync(KEY, JSON.stringify(session), SECURE_STORE_OPTIONS);
  }

  async load(): Promise<Session | null> {
    const raw = await SecureStore.getItemAsync(KEY, SECURE_STORE_OPTIONS);
    if (!raw) return null;
    try {
      const session = JSON.parse(raw) as Session;
      if (typeof session?.token === 'string' && typeof session.expiresAt === 'number' && session.user) {
        return session;
      }
    } catch {
      // Valor corrupto: se descarta abajo.
    }
    await this.clear();
    return null;
  }

  async clear(): Promise<void> {
    await SecureStore.deleteItemAsync(KEY, SECURE_STORE_OPTIONS);
  }
}

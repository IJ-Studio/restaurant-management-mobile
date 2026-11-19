import type { HttpClient } from '../../../../core/http/httpClient';
import type { DevicePlatform, DeviceRegistry } from '../../domain/ports/PushNotifications';

/** POST y DELETE /notifications/devices: el API asocia el token al usuario del JWT. */
export class DeviceRemoteDataSource implements DeviceRegistry {
  constructor(private readonly http: HttpClient) {}

  async register(token: string, platform: DevicePlatform): Promise<void> {
    await this.http.post('notifications/devices', { token, platform });
  }

  async unregister(token: string): Promise<void> {
    await this.http.delete(`notifications/devices/${encodeURIComponent(token)}`);
  }
}

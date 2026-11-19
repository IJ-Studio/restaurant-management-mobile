import type { HttpClient } from '../../../../core/http/httpClient';
import { DeviceRemoteDataSource } from '../datasources/DeviceRemoteDataSource';

const TOKEN = 'ExponentPushToken[abc/123]';

describe('DeviceRemoteDataSource', () => {
  it('registra el teléfono con su plataforma', async () => {
    const http = { post: jest.fn().mockResolvedValue(undefined) };

    await new DeviceRemoteDataSource(http as unknown as HttpClient).register(TOKEN, 'android');

    expect(http.post).toHaveBeenCalledWith('notifications/devices', { token: TOKEN, platform: 'android' });
  });

  it('da de baja el teléfono con el token codificado en la ruta', async () => {
    const http = { delete: jest.fn().mockResolvedValue(undefined) };

    await new DeviceRemoteDataSource(http as unknown as HttpClient).unregister(TOKEN);

    expect(http.delete).toHaveBeenCalledWith('notifications/devices/ExponentPushToken%5Babc%2F123%5D');
  });
});

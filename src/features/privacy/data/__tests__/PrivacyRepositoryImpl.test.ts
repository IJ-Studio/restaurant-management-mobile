import type { HttpClient } from '../../../../core/http/httpClient';
import { PrivacyRemoteDataSource, type PrivacyDto } from '../datasources/PrivacyRemoteDataSource';
import { PrivacyRepositoryImpl } from '../repositories/PrivacyRepositoryImpl';

const dto: PrivacyDto = {
  avisoPrivacidad: { aceptado: true, version: '2026-11', fecha: '2026-11-13 00:32:15.191725-06' },
  notificacionesPush: false,
  reportesErrores: true,
};

function setup() {
  const http = {
    get: jest.fn().mockResolvedValue(dto),
    put: jest.fn().mockResolvedValue(dto),
    delete: jest.fn().mockResolvedValue(undefined),
  };
  return {
    http,
    repository: new PrivacyRepositoryImpl(new PrivacyRemoteDataSource(http as unknown as HttpClient)),
  };
}

describe('PrivacyRepositoryImpl', () => {
  it('lee la privacidad de la cuenta del token y la pasa al dominio', async () => {
    const { http, repository } = setup();

    await expect(repository.get()).resolves.toEqual({
      noticeAccepted: true,
      noticeVersion: '2026-11',
      noticeAcceptedAt: '2026-11-13 00:32:15.191725-06',
      pushNotifications: false,
      errorReports: true,
    });
    expect(http.get).toHaveBeenCalledWith('profile/privacidad');
  });

  it('registra la aceptación del aviso con su versión y el origen móvil', async () => {
    const { http, repository } = setup();

    await repository.acceptNotice('2026-11');

    expect(http.put).toHaveBeenCalledWith('profile/privacidad', {
      origen: 'movil',
      avisoPrivacidad: { aceptado: true, version: '2026-11' },
    });
  });

  it.each([
    ['pushNotifications', 'notificacionesPush'],
    ['errorReports', 'reportesErrores'],
  ] as const)('la preferencia %s viaja como %s', async (preference, field) => {
    const { http, repository } = setup();

    await repository.setPreference(preference, false);

    expect(http.put).toHaveBeenCalledWith('profile/privacidad', { origen: 'movil', [field]: false });
  });

  it('elimina la cuenta con DELETE /account y la contraseña en el cuerpo', async () => {
    const { http, repository } = setup();

    await repository.deleteAccount('Prueba#2026');

    expect(http.delete).toHaveBeenCalledWith('account', { password: 'Prueba#2026' });
  });
});

import type { HttpClient } from '../../../../core/http/httpClient';
import { OperationRulesRemoteDataSource } from '../datasources/OperationRulesRemoteDataSource';

describe('OperationRulesRemoteDataSource', () => {
  it('lee GET /reglas y lo pasa al dominio', async () => {
    const get = jest.fn().mockResolvedValue({
      utcOffsetMin: -360,
      aceptaReservas: true,
      reservas: { anticipacionMin: 90, margenCierreMin: 45, comensalesMax: 20 },
      pedidos: { cantidadMaxPorPlatillo: 30 },
      horario: [{ dia: 0, apertura: '09:00:00', cierre: '18:00:00', cocinaCierre: null, cerrado: false }],
      diasEspeciales: [],
    });

    const rules = await new OperationRulesRemoteDataSource({ get } as unknown as HttpClient).get();

    expect(get).toHaveBeenCalledWith('reglas');
    expect(rules).toMatchObject({
      minAdvanceMin: 90,
      closingMarginMin: 45,
      maxPartySize: 20,
      maxQuantityPerDish: 30,
      schedule: [{ day: 0, opens: '09:00:00', closes: '18:00:00', kitchenCloses: null, closed: false }],
    });
  });
});

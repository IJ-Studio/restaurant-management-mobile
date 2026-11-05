/**
 * @jest-environment node
 */
import { KitchenRepositoryImpl } from '../../features/kitchen/data/KitchenRepositoryImpl';
import { clienteComo, describeReal } from '../../core/testing/clienteReal';

jest.setTimeout(60_000);

// Mermas (Prioridad 1.2): solo el personal operativo registra; el admin solo consulta el registro.
describeReal('móvil contra el API real: mermas (Prioridad 1.2)', () => {
  it('cocina registra una merma y el admin la ve en las mermas del día con quién la reportó', async () => {
    const marca = `Movil merma ${Date.now()}`;
    const cocina = new KitchenRepositoryImpl(await clienteComo('cocina'));
    await cocina.reportWaste({ productName: 'Prueba movil', quantity: 1, unit: 'pza', reason: 'otro', justification: marca });
    const admin = new KitchenRepositoryImpl(await clienteComo('admin'));
    const registro = (await admin.listWasteToday()).find((w) => w.justification.toUpperCase() === marca.toUpperCase());
    expect(registro?.reportedBy).toMatch(/cocina/i);
  });

  it('el API rechaza la merma del admin (403)', async () => {
    const admin = new KitchenRepositoryImpl(await clienteComo('admin'));
    await expect(
      admin.reportWaste({ productName: 'Prueba movil', quantity: 1, unit: 'pza', reason: 'otro', justification: 'Prueba de permisos' }),
    ).rejects.toMatchObject({ kind: 'forbidden' });
  });
});

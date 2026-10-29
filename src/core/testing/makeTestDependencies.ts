import { makeSession } from '../../features/auth/__fixtures__/auth';
import { createSessionStore } from '../../features/auth/presentation/store/sessionStore';
import { createCurrentOrderStore } from '../../features/orders/presentation/store/currentOrderStore';
import type { Dependencies } from '../di/dependencies';
import type { HttpClient } from '../http/httpClient';

/** Consulta que nunca responde: la pantalla se queda cargando y no actualiza estado fuera de la prueba. */
const pending = () => jest.fn(() => new Promise<never>(() => {}));

/** Dependencias falsas para pruebas de UI: cada caso de uso es un jest.fn() que se puede sobrescribir. */
export function makeTestDependencies(overrides: Partial<Dependencies> = {}): Dependencies {
  return {
    httpClient: {} as HttpClient,
    sessionStore: createSessionStore(),
    loginUseCase: { execute: jest.fn().mockResolvedValue(makeSession()) },
    logoutUseCase: { execute: jest.fn().mockResolvedValue(undefined) },
    restoreSessionUseCase: { execute: jest.fn().mockResolvedValue(null) },
    getMenuUseCase: { execute: pending() },
    getDishUseCase: { execute: jest.fn().mockRejectedValue(new Error('sin configurar')) },
    createReservationUseCase: { execute: jest.fn().mockRejectedValue(new Error('sin configurar')) },
    listActiveReservationsUseCase: { execute: pending() },
    listRecentReservationsUseCase: { execute: pending() },
    currentOrderStore: createCurrentOrderStore(),
    listTablesUseCase: { execute: pending() },
    sendOrderToKitchenUseCase: { execute: jest.fn().mockRejectedValue(new Error('sin configurar')) },
    listActiveOrdersUseCase: { execute: pending() },
    getOrderDetailUseCase: { execute: pending() },
    confirmOrderUseCase: { execute: jest.fn().mockRejectedValue(new Error('sin configurar')) },
    cancelOrderUseCase: { execute: jest.fn().mockRejectedValue(new Error('sin configurar')) },
    removeOrderItemUseCase: { execute: jest.fn().mockRejectedValue(new Error('sin configurar')) },
    getDashboardUseCase: { execute: pending() },
    updateOrderStatusUseCase: { execute: jest.fn().mockRejectedValue(new Error('sin configurar')) },
    listPaymentMethodsUseCase: { execute: pending() },
    chargeOrderUseCase: { execute: jest.fn().mockRejectedValue(new Error('sin configurar')) },
    getProfileUseCase: { execute: pending() },
    updateProfileUseCase: { execute: jest.fn().mockRejectedValue(new Error('sin configurar')) },
    changePasswordUseCase: { execute: jest.fn().mockRejectedValue(new Error('sin configurar')) },
    ...overrides,
  };
}

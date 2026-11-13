import { makeSession } from '../../features/auth/__fixtures__/auth';
import { createSessionStore } from '../../features/auth/presentation/store/sessionStore';
import { createCurrentOrderStore } from '../../features/orders/presentation/store/currentOrderStore';
import {
  PRIVACY_NOTICE_VERSION,
  type PrivacySettings,
} from '../../features/privacy/domain/entities/PrivacySettings';
import type { Dependencies } from '../di/dependencies';
import type { HttpClient } from '../http/httpClient';

/** Aviso de privacidad ya aceptado en la versión vigente: la compuerta deja pasar. */
export const acceptedPrivacy: PrivacySettings = {
  noticeAccepted: true,
  noticeVersion: PRIVACY_NOTICE_VERSION,
  noticeAcceptedAt: '2026-11-01T10:00:00.000Z',
  pushNotifications: true,
  errorReports: true,
};

/** Resuelve de inmediato con un permiso ya concedido: no bloquea pantallas que no prueban HU-07. */
const grantedPermission = () =>
  jest.fn().mockResolvedValue({ status: 'granted' as const, canAskAgain: true });

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
    updateDishUseCase: {
      setAvailable: jest.fn().mockResolvedValue(undefined),
      setPrice: jest.fn().mockResolvedValue(undefined),
    },
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
    privacyRepository: {
      get: jest.fn().mockResolvedValue(acceptedPrivacy),
      acceptNotice: jest.fn().mockResolvedValue(acceptedPrivacy),
      setPreference: jest.fn().mockResolvedValue(acceptedPrivacy),
    },
    deleteAccountUseCase: { execute: jest.fn().mockRejectedValue(new Error('sin configurar')) },
    getCashSessionUseCase: { execute: pending() },
    openCashRegisterUseCase: { execute: jest.fn().mockRejectedValue(new Error('sin configurar')) },
    closeCashRegisterUseCase: { execute: jest.fn().mockRejectedValue(new Error('sin configurar')) },
    // Sin incidencias por defecto: las listas de pedidos las consultan siempre.
    listIncidentsUseCase: { execute: jest.fn().mockResolvedValue([]) },
    reportIncidentUseCase: { execute: jest.fn().mockRejectedValue(new Error('sin configurar')) },
    listInventoryProductsUseCase: { execute: pending() },
    reportWasteUseCase: { execute: jest.fn().mockRejectedValue(new Error('sin configurar')) },
    listWasteTodayUseCase: { execute: pending() },
    payrollRepository: { summary: pending(), movements: pending() },
    addPayrollMovementUseCase: { execute: jest.fn().mockRejectedValue(new Error('sin configurar')) },
    correctPayrollMovementUseCase: { execute: jest.fn().mockRejectedValue(new Error('sin configurar')) },
    tablesRepository: {
      list: pending(),
      areas: pending(),
      create: pending(),
      update: pending(),
      remove: pending(),
    },
    saveTableUseCase: { execute: jest.fn().mockRejectedValue(new Error('sin configurar')) },
    staffRepository: {
      list: pending(),
      create: pending(),
      update: pending(),
      changeRole: pending(),
      deactivate: pending(),
      reactivate: pending(),
    },
    saveStaffUseCase: { execute: jest.fn().mockRejectedValue(new Error('sin configurar')) },
    payrollEmployeesRepository: { list: pending(), create: pending(), update: pending(), remove: pending() },
    saveEmployeeUseCase: { execute: jest.fn().mockRejectedValue(new Error('sin configurar')) },
    checkoutUseCase: {
      execute: jest.fn().mockRejectedValue(new Error('sin configurar')),
      isAvailable: jest.fn().mockReturnValue(false),
    },
    // Sin respuesta: los formularios usan las reglas por defecto, iguales a las del servidor.
    reservationTables: { freeTables: jest.fn().mockResolvedValue([]) },
    changeReservationStatusUseCase: { execute: jest.fn().mockResolvedValue(undefined) },
    operationRules: { get: jest.fn().mockRejectedValue(new Error('sin configurar')) },
    orderEvents: { subscribe: jest.fn(() => () => undefined) },
    deviceRegistrationUseCase: { register: jest.fn().mockResolvedValue(false) },
    pushNotifications: { onNotificationOpened: jest.fn(() => () => undefined) },
    enableNotificationsUseCase: { execute: grantedPermission() },
    ...overrides,
  };
}

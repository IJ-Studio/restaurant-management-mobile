import { DashboardRemoteDataSource } from '../../features/admin/data/datasources/DashboardRemoteDataSource';
import { DashboardRepositoryImpl } from '../../features/admin/data/repositories/DashboardRepositoryImpl';
import { GetDashboardUseCase } from '../../features/admin/domain/usecases/GetDashboardUseCase';
import { CashRegisterRepositoryImpl } from '../../features/cashier/data/CashRegisterRepositoryImpl';
import {
  CloseCashRegisterUseCase,
  GetCashSessionUseCase,
  OpenCashRegisterUseCase,
} from '../../features/cashier/domain/CashRegister';
import { KitchenRepositoryImpl } from '../../features/kitchen/data/KitchenRepositoryImpl';
import {
  ListIncidentsUseCase,
  ListInventoryProductsUseCase,
  ListWasteTodayUseCase,
  ReportIncidentUseCase,
  ReportWasteUseCase,
} from '../../features/kitchen/domain/Kitchen';
import { AuthRemoteDataSource } from '../../features/auth/data/datasources/AuthRemoteDataSource';
import { AuthRepositoryImpl } from '../../features/auth/data/repositories/AuthRepositoryImpl';
import { SecureSessionStorage } from '../../features/auth/data/storage/SecureSessionStorage';
import { LoginUseCase } from '../../features/auth/domain/usecases/LoginUseCase';
import { LogoutUseCase } from '../../features/auth/domain/usecases/LogoutUseCase';
import type { SessionStorage } from '../../features/auth/domain/repositories/SessionStorage';
import { RestoreSessionUseCase } from '../../features/auth/domain/usecases/RestoreSessionUseCase';
import { createSessionStore, type SessionStore } from '../../features/auth/presentation/store/sessionStore';
import { MenuRemoteDataSource } from '../../features/menu/data/datasources/MenuRemoteDataSource';
import { MenuRepositoryImpl } from '../../features/menu/data/repositories/MenuRepositoryImpl';
import { GetDishUseCase } from '../../features/menu/domain/usecases/GetDishUseCase';
import { GetMenuUseCase } from '../../features/menu/domain/usecases/GetMenuUseCase';
import { OrderRemoteDataSource } from '../../features/orders/data/datasources/OrderRemoteDataSource';
import { OrderRepositoryImpl } from '../../features/orders/data/repositories/OrderRepositoryImpl';
import { CancelOrderUseCase } from '../../features/orders/domain/usecases/CancelOrderUseCase';
import { ChargeOrderUseCase } from '../../features/orders/domain/usecases/ChargeOrderUseCase';
import { ConfirmOrderUseCase } from '../../features/orders/domain/usecases/ConfirmOrderUseCase';
import { GetOrderDetailUseCase } from '../../features/orders/domain/usecases/GetOrderDetailUseCase';
import { ListActiveOrdersUseCase } from '../../features/orders/domain/usecases/ListActiveOrdersUseCase';
import { ListPaymentMethodsUseCase } from '../../features/orders/domain/usecases/ListPaymentMethodsUseCase';
import { ListTablesUseCase } from '../../features/orders/domain/usecases/ListTablesUseCase';
import { RemoveOrderItemUseCase } from '../../features/orders/domain/usecases/RemoveOrderItemUseCase';
import { UpdateOrderStatusUseCase } from '../../features/orders/domain/usecases/UpdateOrderStatusUseCase';
import { ProfileRemoteDataSource } from '../../features/profile/data/datasources/ProfileRemoteDataSource';
import { ProfileRepositoryImpl } from '../../features/profile/data/repositories/ProfileRepositoryImpl';
import { ChangePasswordUseCase } from '../../features/profile/domain/usecases/ChangePasswordUseCase';
import { GetProfileUseCase } from '../../features/profile/domain/usecases/GetProfileUseCase';
import { UpdateProfileUseCase } from '../../features/profile/domain/usecases/UpdateProfileUseCase';
import { SendOrderToKitchenUseCase } from '../../features/orders/domain/usecases/SendOrderToKitchenUseCase';
import {
  createCurrentOrderStore,
  type CurrentOrderStore,
} from '../../features/orders/presentation/store/currentOrderStore';
import { ReservationRemoteDataSource } from '../../features/reservations/data/datasources/ReservationRemoteDataSource';
import { ReservationRepositoryImpl } from '../../features/reservations/data/repositories/ReservationRepositoryImpl';
import { CreateReservationUseCase } from '../../features/reservations/domain/usecases/CreateReservationUseCase';
import { ListActiveReservationsUseCase } from '../../features/reservations/domain/usecases/ListActiveReservationsUseCase';
import { ListRecentReservationsUseCase } from '../../features/reservations/domain/usecases/ListRecentReservationsUseCase';
import { SESSION_EXPIRED_MESSAGE } from '../errors/AppError';
import { httpClient, type HttpClient } from '../http/httpClient';

/**
 * Grafo de dependencias de la app. Cada feature agrega aquí sus casos de uso
 * (p. ej. `loginUseCase`) construidos con sus implementaciones de `data/`.
 * Los ViewModels los obtienen con `useDependencies()`, nunca con un import directo.
 */
export interface Dependencies {
  httpClient: HttpClient;
  sessionStore: SessionStore;
  loginUseCase: Pick<LoginUseCase, 'execute'>;
  logoutUseCase: Pick<LogoutUseCase, 'execute'>;
  restoreSessionUseCase: Pick<RestoreSessionUseCase, 'execute'>;
  getMenuUseCase: Pick<GetMenuUseCase, 'execute'>;
  getDishUseCase: Pick<GetDishUseCase, 'execute'>;
  createReservationUseCase: Pick<CreateReservationUseCase, 'execute'>;
  listActiveReservationsUseCase: Pick<ListActiveReservationsUseCase, 'execute'>;
  listRecentReservationsUseCase: Pick<ListRecentReservationsUseCase, 'execute'>;
  currentOrderStore: CurrentOrderStore;
  listTablesUseCase: Pick<ListTablesUseCase, 'execute'>;
  sendOrderToKitchenUseCase: Pick<SendOrderToKitchenUseCase, 'execute'>;
  listActiveOrdersUseCase: Pick<ListActiveOrdersUseCase, 'execute'>;
  getOrderDetailUseCase: Pick<GetOrderDetailUseCase, 'execute'>;
  confirmOrderUseCase: Pick<ConfirmOrderUseCase, 'execute'>;
  cancelOrderUseCase: Pick<CancelOrderUseCase, 'execute'>;
  removeOrderItemUseCase: Pick<RemoveOrderItemUseCase, 'execute'>;
  getDashboardUseCase: Pick<GetDashboardUseCase, 'execute'>;
  updateOrderStatusUseCase: Pick<UpdateOrderStatusUseCase, 'execute'>;
  listPaymentMethodsUseCase: Pick<ListPaymentMethodsUseCase, 'execute'>;
  chargeOrderUseCase: Pick<ChargeOrderUseCase, 'execute'>;
  getProfileUseCase: Pick<GetProfileUseCase, 'execute'>;
  updateProfileUseCase: Pick<UpdateProfileUseCase, 'execute'>;
  changePasswordUseCase: Pick<ChangePasswordUseCase, 'execute'>;
  getCashSessionUseCase: Pick<GetCashSessionUseCase, 'execute'>;
  openCashRegisterUseCase: Pick<OpenCashRegisterUseCase, 'execute'>;
  closeCashRegisterUseCase: Pick<CloseCashRegisterUseCase, 'execute'>;
  listIncidentsUseCase: Pick<ListIncidentsUseCase, 'execute'>;
  reportIncidentUseCase: Pick<ReportIncidentUseCase, 'execute'>;
  listInventoryProductsUseCase: Pick<ListInventoryProductsUseCase, 'execute'>;
  reportWasteUseCase: Pick<ReportWasteUseCase, 'execute'>;
  listWasteTodayUseCase: Pick<ListWasteTodayUseCase, 'execute'>;
}

/**
 * Infraestructura que se puede sustituir. La app usa los valores por defecto; las pruebas de
 * integración pasan un `HttpClient` contra el API falso con datos de prueba y un almacenamiento en memoria.
 */
export interface Infrastructure {
  httpClient?: HttpClient;
  sessionStorage?: SessionStorage;
}

export function createDependencies({
  httpClient: http = httpClient,
  sessionStorage = new SecureSessionStorage(),
}: Infrastructure = {}): Dependencies {
  const sessionStore = createSessionStore();
  http.setTokenProvider(() => sessionStore.getState().session?.token ?? null);

  // Token vencido o revocado: se borra la sesión guardada y se vuelve al Login con el aviso.
  // Solo la primera petición rechazada lo hace; las demás ya no llevan token.
  http.setUnauthorizedHandler(() => {
    if (sessionStore.getState().status !== 'authenticated') return;
    sessionStore.getState().expireSession(SESSION_EXPIRED_MESSAGE);
    sessionStorage.clear().catch(() => undefined);
  });

  // Al cerrar sesión no queda el pedido a medias de otro mesero.
  const currentOrderStore = createCurrentOrderStore();
  sessionStore.subscribe((state) => {
    if (state.status === 'unauthenticated') currentOrderStore.getState().clear();
  });

  const authRepository = new AuthRepositoryImpl(new AuthRemoteDataSource(http));
  const menuRepository = new MenuRepositoryImpl(new MenuRemoteDataSource(http));
  const reservationRepository = new ReservationRepositoryImpl(new ReservationRemoteDataSource(http));
  const orderRepository = new OrderRepositoryImpl(new OrderRemoteDataSource(http));
  const dashboardRepository = new DashboardRepositoryImpl(new DashboardRemoteDataSource(http));
  const profileRepository = new ProfileRepositoryImpl(new ProfileRemoteDataSource(http));
  const cashRepository = new CashRegisterRepositoryImpl(http);
  const kitchenRepository = new KitchenRepositoryImpl(http);

  return {
    httpClient: http,
    sessionStore,
    loginUseCase: new LoginUseCase(authRepository, sessionStorage),
    logoutUseCase: new LogoutUseCase(authRepository, sessionStorage),
    restoreSessionUseCase: new RestoreSessionUseCase(sessionStorage),
    getMenuUseCase: new GetMenuUseCase(menuRepository),
    getDishUseCase: new GetDishUseCase(menuRepository),
    createReservationUseCase: new CreateReservationUseCase(reservationRepository),
    listActiveReservationsUseCase: new ListActiveReservationsUseCase(reservationRepository),
    listRecentReservationsUseCase: new ListRecentReservationsUseCase(reservationRepository),
    currentOrderStore,
    listTablesUseCase: new ListTablesUseCase(orderRepository),
    sendOrderToKitchenUseCase: new SendOrderToKitchenUseCase(orderRepository),
    listActiveOrdersUseCase: new ListActiveOrdersUseCase(orderRepository),
    getOrderDetailUseCase: new GetOrderDetailUseCase(orderRepository),
    confirmOrderUseCase: new ConfirmOrderUseCase(orderRepository),
    cancelOrderUseCase: new CancelOrderUseCase(orderRepository),
    removeOrderItemUseCase: new RemoveOrderItemUseCase(orderRepository),
    getDashboardUseCase: new GetDashboardUseCase(dashboardRepository, orderRepository),
    updateOrderStatusUseCase: new UpdateOrderStatusUseCase(orderRepository),
    listPaymentMethodsUseCase: new ListPaymentMethodsUseCase(orderRepository),
    chargeOrderUseCase: new ChargeOrderUseCase(orderRepository),
    getProfileUseCase: new GetProfileUseCase(profileRepository),
    updateProfileUseCase: new UpdateProfileUseCase(profileRepository, sessionStorage),
    changePasswordUseCase: new ChangePasswordUseCase(profileRepository),
    getCashSessionUseCase: new GetCashSessionUseCase(cashRepository),
    openCashRegisterUseCase: new OpenCashRegisterUseCase(cashRepository),
    closeCashRegisterUseCase: new CloseCashRegisterUseCase(cashRepository),
    listIncidentsUseCase: new ListIncidentsUseCase(kitchenRepository),
    reportIncidentUseCase: new ReportIncidentUseCase(kitchenRepository),
    listInventoryProductsUseCase: new ListInventoryProductsUseCase(kitchenRepository),
    reportWasteUseCase: new ReportWasteUseCase(kitchenRepository),
    listWasteTodayUseCase: new ListWasteTodayUseCase(kitchenRepository),
  };
}

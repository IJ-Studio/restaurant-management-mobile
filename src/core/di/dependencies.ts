import { AuthRemoteDataSource } from '../../features/auth/data/datasources/AuthRemoteDataSource';
import { AuthRepositoryImpl } from '../../features/auth/data/repositories/AuthRepositoryImpl';
import { SecureSessionStorage } from '../../features/auth/data/storage/SecureSessionStorage';
import { LoginUseCase } from '../../features/auth/domain/usecases/LoginUseCase';
import { LogoutUseCase } from '../../features/auth/domain/usecases/LogoutUseCase';
import { RestoreSessionUseCase } from '../../features/auth/domain/usecases/RestoreSessionUseCase';
import { createSessionStore, type SessionStore } from '../../features/auth/presentation/store/sessionStore';
import { MenuRemoteDataSource } from '../../features/menu/data/datasources/MenuRemoteDataSource';
import { MenuRepositoryImpl } from '../../features/menu/data/repositories/MenuRepositoryImpl';
import { GetDishUseCase } from '../../features/menu/domain/usecases/GetDishUseCase';
import { GetMenuUseCase } from '../../features/menu/domain/usecases/GetMenuUseCase';
import { ReservationRemoteDataSource } from '../../features/reservations/data/datasources/ReservationRemoteDataSource';
import { ReservationRepositoryImpl } from '../../features/reservations/data/repositories/ReservationRepositoryImpl';
import { CreateReservationUseCase } from '../../features/reservations/domain/usecases/CreateReservationUseCase';
import { ListActiveReservationsUseCase } from '../../features/reservations/domain/usecases/ListActiveReservationsUseCase';
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
}

export function createDependencies(): Dependencies {
  const sessionStore = createSessionStore();
  httpClient.setTokenProvider(() => sessionStore.getState().session?.token ?? null);

  const sessionStorage = new SecureSessionStorage();
  const authRepository = new AuthRepositoryImpl(new AuthRemoteDataSource(httpClient));
  const menuRepository = new MenuRepositoryImpl(new MenuRemoteDataSource(httpClient));
  const reservationRepository = new ReservationRepositoryImpl(new ReservationRemoteDataSource(httpClient));

  return {
    httpClient,
    sessionStore,
    loginUseCase: new LoginUseCase(authRepository, sessionStorage),
    logoutUseCase: new LogoutUseCase(authRepository, sessionStorage),
    restoreSessionUseCase: new RestoreSessionUseCase(sessionStorage),
    getMenuUseCase: new GetMenuUseCase(menuRepository),
    getDishUseCase: new GetDishUseCase(menuRepository),
    createReservationUseCase: new CreateReservationUseCase(reservationRepository),
    listActiveReservationsUseCase: new ListActiveReservationsUseCase(reservationRepository),
  };
}

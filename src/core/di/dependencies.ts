import { AuthRemoteDataSource } from '../../features/auth/data/datasources/AuthRemoteDataSource';
import { AuthRepositoryImpl } from '../../features/auth/data/repositories/AuthRepositoryImpl';
import { SecureSessionStorage } from '../../features/auth/data/storage/SessionStorage';
import { LoginUseCase } from '../../features/auth/domain/usecases/LoginUseCase';
import { LogoutUseCase } from '../../features/auth/domain/usecases/LogoutUseCase';
import { RestoreSessionUseCase } from '../../features/auth/domain/usecases/RestoreSessionUseCase';
import { MenuRemoteDataSource } from '../../features/menu/data/datasources/MenuRemoteDataSource';
import { MenuRepositoryImpl } from '../../features/menu/data/repositories/MenuRepositoryImpl';
import { GetDishUseCase } from '../../features/menu/domain/usecases/GetDishUseCase';
import { GetMenuUseCase } from '../../features/menu/domain/usecases/GetMenuUseCase';
import { httpClient, type HttpClient } from '../http/httpClient';

/**
 * Grafo de dependencias de la app. Cada feature agrega aquí sus casos de uso
 * (p. ej. `loginUseCase`) construidos con sus implementaciones de `data/`.
 * Los ViewModels los obtienen con `useDependencies()`, nunca con un import directo.
 */
export interface Dependencies {
  httpClient: HttpClient;
  // HU-01
  loginUseCase: LoginUseCase;
  logoutUseCase: LogoutUseCase;
  restoreSessionUseCase: RestoreSessionUseCase;
  // HU-03
  getMenuUseCase: GetMenuUseCase;
  getDishUseCase: GetDishUseCase;
}

export function createDependencies(): Dependencies {
  const authRepository = new AuthRepositoryImpl(new AuthRemoteDataSource(httpClient), new SecureSessionStorage());
  const menuRepository = new MenuRepositoryImpl(new MenuRemoteDataSource(httpClient));

  return {
    httpClient,
    loginUseCase: new LoginUseCase(authRepository),
    logoutUseCase: new LogoutUseCase(authRepository),
    restoreSessionUseCase: new RestoreSessionUseCase(authRepository),
    getMenuUseCase: new GetMenuUseCase(menuRepository),
    getDishUseCase: new GetDishUseCase(menuRepository),
  };
}

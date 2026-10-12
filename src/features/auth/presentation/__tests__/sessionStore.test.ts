import { makeSession } from '../../__fixtures__/auth';
import { createSessionStore } from '../store/sessionStore';

describe('sessionStore', () => {
  it('arranca recuperando la sesión', () => {
    expect(createSessionStore().getState()).toMatchObject({ status: 'restoring', session: null });
  });

  it('guarda y limpia la sesión', () => {
    const store = createSessionStore();
    const session = makeSession();

    store.getState().setSession(session);
    expect(store.getState()).toMatchObject({ status: 'authenticated', session });

    store.getState().clearSession();
    expect(store.getState()).toMatchObject({ status: 'unauthenticated', session: null });
  });
});

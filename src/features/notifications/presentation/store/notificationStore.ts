import { create } from 'zustand';

import type { PermissionState } from '../../domain/ports/PushNotifications';

interface NotificationState {
  /** `null` mientras no se ha consultado. Es un permiso del dispositivo, no dato del servidor. */
  permission: PermissionState | null;
  setPermission: (permission: PermissionState) => void;
  /** La persona eligió «Ahora no» en la explicación: no se le vuelve a mostrar hasta abrir la app otra vez. */
  rationaleDismissed: boolean;
  dismissRationale: () => void;
}

export const useNotificationStore = create<NotificationState>()((set) => ({
  permission: null,
  setPermission: (permission) => set({ permission }),
  rationaleDismissed: false,
  dismissRationale: () => set({ rationaleDismissed: true }),
}));

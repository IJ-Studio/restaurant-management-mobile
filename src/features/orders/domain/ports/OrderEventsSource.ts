import type { OrderEvent } from '../entities/OrderEvent';

export interface OrderEventsListener {
  /** El flujo quedó conectado (la primera vez o tras reconectar): conviene sincronizar una vez. */
  onReady(): void;
  onEvent(event: OrderEvent): void;
}

/**
 * Puerto del tiempo real de pedidos (patrón Observer): quien se suscribe recibe cada cambio en
 * cuanto ocurre. El dominio no sabe si llega por SSE, WebSocket u otro medio.
 */
export interface OrderEventsSource {
  /** Abre el flujo y devuelve cómo cerrarlo. */
  subscribe(listener: OrderEventsListener): () => void;
}

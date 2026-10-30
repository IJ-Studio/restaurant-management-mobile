import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import { useDependencies } from '../../../core/di/DependenciesProvider';
import { userMessage } from '../../../core/errors/AppError';
import { feedback } from '../../../shared/presentation/feedback';
import { parseAmount } from '../../orders/domain/entities/Payment';
import {
  incidentLabel,
  searchProducts,
  type Incident,
  type IncidentType,
  type InventoryProduct,
  type WasteReason,
} from '../domain/Kitchen';

export const kitchenQueryKeys = {
  incidents: (orderId?: string) => ['incidents', orderId ?? 'today'] as const,
  allIncidents: ['incidents'] as const,
  products: ['inventory', 'products'] as const,
  waste: ['inventory', 'waste'] as const,
};

/** Texto corto de una incidencia para tarjetas y avisos ("Retraso de 15 min · Diego"). */
export function incidentSummary(incident: Incident): string {
  const what =
    incident.type === 'retraso' && incident.minutes
      ? `Retraso de ${incident.minutes} min`
      : incidentLabel(incident.type);
  return [what, incident.message, incident.reportedBy].filter(Boolean).join(' · ');
}

/** Incidencias de hoy (o de un pedido). Se refrescan solas para que el piso vea los retrasos. */
export function useIncidents(orderId?: string) {
  const { listIncidentsUseCase } = useDependencies();
  const query = useQuery({
    queryKey: kitchenQueryKeys.incidents(orderId),
    queryFn: () => listIncidentsUseCase.execute(orderId),
    staleTime: 15 * 1000,
    refetchInterval: 30 * 1000,
  });
  // La más reciente de cada pedido, para marcar su tarjeta.
  const byOrder = useMemo(() => {
    const map = new Map<string, Incident>();
    for (const incident of query.data ?? []) {
      if (incident.orderId && !map.has(incident.orderId)) map.set(incident.orderId, incident);
    }
    return map;
  }, [query.data]);
  return {
    incidents: query.data ?? [],
    byOrder,
    isLoading: query.isPending,
    errorMessage: query.error ? userMessage(query.error, 'No se pudieron cargar las incidencias.') : null,
    refresh: () => query.refetch(),
  };
}

/** Formulario para reportar una incidencia (del pedido o general). */
export function useReportIncident(orderId: string | undefined, onDone: (message: string) => void) {
  const { reportIncidentUseCase } = useDependencies();
  const queryClient = useQueryClient();
  const [type, setType] = useState<IncidentType>('retraso');
  const [minutes, setMinutes] = useState<number | undefined>(undefined);
  const [message, setMessage] = useState('');

  const report = useMutation({
    mutationFn: () => reportIncidentUseCase.execute({ type, orderId, minutes, message }),
    onSuccess: (result) => {
      feedback.success();
      void queryClient.invalidateQueries({ queryKey: kitchenQueryKeys.allIncidents });
      onDone(result);
    },
    onError: () => feedback.error(),
  });

  return {
    type,
    selectType: (next: IncidentType) => {
      feedback.select();
      setType(next);
    },
    minutes,
    setMinutes,
    message,
    setMessage,
    submit: () => report.mutate(),
    isSending: report.isPending,
    errorMessage: report.error ? userMessage(report.error, 'No se pudo reportar la incidencia.') : null,
  };
}

/** Formulario de merma: busca el producto del inventario o permite escribirlo. */
export function useReportWaste(onDone: (message: string) => void) {
  const { listInventoryProductsUseCase, reportWasteUseCase } = useDependencies();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [product, setProduct] = useState<InventoryProduct | null>(null);
  const [freeName, setFreeName] = useState('');
  const [quantityText, setQuantityText] = useState('');
  const [unit, setUnit] = useState('');
  const [reason, setReason] = useState<WasteReason>('caducado');
  const [justification, setJustification] = useState('');

  const products = useQuery({
    queryKey: kitchenQueryKeys.products,
    queryFn: () => listInventoryProductsUseCase.execute(),
    staleTime: 5 * 60 * 1000,
  });

  const quantity = parseAmount(quantityText.replace(',', '.'));
  const report = useMutation({
    mutationFn: () =>
      reportWasteUseCase.execute({
        productId: product?.id,
        productName: product ? undefined : freeName,
        quantity,
        unit: product ? undefined : unit.trim() || undefined,
        reason,
        justification,
      }),
    onSuccess: (result) => {
      feedback.success();
      void queryClient.invalidateQueries({ queryKey: kitchenQueryKeys.waste });
      void queryClient.invalidateQueries({ queryKey: kitchenQueryKeys.products });
      onDone(result);
    },
    onError: () => feedback.error(),
  });

  return {
    search,
    setSearch,
    matches: searchProducts(products.data ?? [], search),
    productsLoading: products.isPending,
    productsError: products.error ? userMessage(products.error, 'No se pudo cargar el inventario.') : null,
    product,
    selectProduct: (next: InventoryProduct | null) => {
      feedback.select();
      setProduct(next);
    },
    freeName,
    setFreeName,
    quantityText,
    setQuantityText,
    unit,
    setUnit,
    /** Costo estimado de la merma con el costo del inventario. */
    estimatedCost: product && Number.isFinite(quantity) ? quantity * product.costPerUnit : undefined,
    reason,
    setReason,
    justification,
    setJustification,
    submit: () => report.mutate(),
    isSending: report.isPending,
    errorMessage: report.error ? userMessage(report.error, 'No se pudo registrar la merma.') : null,
  };
}

/** Mermas de hoy para la pantalla de reportes. */
export function useWasteToday() {
  const { listWasteTodayUseCase } = useDependencies();
  const query = useQuery({
    queryKey: kitchenQueryKeys.waste,
    queryFn: () => listWasteTodayUseCase.execute(),
  });
  const records = query.data ?? [];
  return {
    records,
    totalCost: records.reduce((sum, record) => sum + record.cost, 0),
    isLoading: query.isPending,
    errorMessage: query.error ? userMessage(query.error, 'No se pudieron cargar las mermas.') : null,
    refresh: () => query.refetch(),
  };
}

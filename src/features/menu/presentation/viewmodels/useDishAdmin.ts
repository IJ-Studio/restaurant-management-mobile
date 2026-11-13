import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { useDependencies } from '../../../../core/di/DependenciesProvider';
import { userMessage } from '../../../../core/errors/AppError';
import { feedback } from '../../../../shared/presentation/feedback';
import type { Dish } from '../../domain/entities/Dish';
import { menuQueryKeys } from './menuQueryKeys';

/** ViewModel de los controles del administrador en la ficha del platillo. */
export function useDishAdmin(dish: Dish) {
  const { updateDishUseCase } = useDependencies();
  const queryClient = useQueryClient();
  const [priceText, setPriceText] = useState(dish.price.toFixed(2));
  const [notice, setNotice] = useState<string | null>(null);

  const refresh = () => queryClient.invalidateQueries({ queryKey: menuQueryKeys.all });

  const availability = useMutation({
    mutationFn: (available: boolean) => updateDishUseCase.setAvailable(dish.id, available),
    onSuccess: async (_data, available) => {
      feedback.success();
      setNotice(available ? 'Disponible para pedir.' : 'Marcado como agotado: ya no se puede pedir.');
      await refresh();
    },
    onError: () => feedback.error(),
  });

  const price = useMutation({
    mutationFn: () => updateDishUseCase.setPrice(dish.id, Number(priceText.replace(/[$,\s]/g, ''))),
    onSuccess: async () => {
      feedback.success();
      setNotice('Precio guardado.');
      await refresh();
    },
    onError: () => feedback.error(),
  });

  const error = availability.error ?? price.error;
  return {
    available: availability.isPending ? (availability.variables ?? dish.available) : dish.available,
    setAvailable: (value: boolean) => {
      setNotice(null);
      availability.mutate(value);
    },
    isSavingAvailability: availability.isPending,
    priceText,
    setPriceText,
    savePrice: () => {
      setNotice(null);
      price.mutate();
    },
    isSavingPrice: price.isPending,
    priceChanged: priceText.trim() !== dish.price.toFixed(2),
    notice,
    error: error ? userMessage(error, 'No se pudo guardar el cambio.') : null,
  };
}

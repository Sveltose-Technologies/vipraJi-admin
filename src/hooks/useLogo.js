import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../api/logo';

export const useLogos = () => {
  return useQuery({
    queryKey: ['logos'],
    queryFn: api.getAllLogos,
  });
};

export const useLogoById = (id) => {
  return useQuery({
    queryKey: ['logo', id],
    queryFn: () => api.getLogoById(id),
    enabled: !!id,
  });
};

export const useCreateLogo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createLogo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logos'] });
    },
  });
};

export const useUpdateLogo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.updateLogo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logos'] });
    },
  });
};

export const useDeleteLogo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deleteLogo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logos'] });
    },
  });
};

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchVerifiedIdentity, requestPseudoVerification, logoutDevice, renamePseudo } from '../api/client';
import { ApiError } from '../api/apiClient';

// Hook partagé pour l'identité "compte" à l'échelle de l'app (Navbar, modale
// d'ajout de panneau, ...) — react-query dédoublonne automatiquement les
// appels concurrents à la même queryKey, donc l'utiliser à plusieurs endroits
// ne déclenche pas de requêtes réseau en double.
export function useIdentity() {
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['auth', 'me'],
        queryFn: fetchVerifiedIdentity,
        staleTime: 5 * 60 * 1000,
    });

    const invalidate = () => queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });

    const claimMutation = useMutation({
        mutationFn: ({ username, email }: { username: string; email: string }) => requestPseudoVerification(username, email),
    });

    const logoutMutation = useMutation({
        mutationFn: logoutDevice,
        onSuccess: () => invalidate(),
    });

    const renameMutation = useMutation({
        mutationFn: (newUsername: string) => renamePseudo(newUsername),
        onSuccess: () => invalidate(),
    });

    return {
        username: data?.username ?? null,
        isLoading,
        claim: claimMutation.mutateAsync,
        isClaiming: claimMutation.isPending,
        logout: logoutMutation.mutateAsync,
        isLoggingOut: logoutMutation.isPending,
        rename: renameMutation.mutateAsync,
        isRenaming: renameMutation.isPending,
    };
}

export function describeIdentityError(err: unknown): string {
    if (err instanceof ApiError) return err.message;
    return 'Une erreur est survenue. Réessayez.';
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchVerifiedIdentity, requestPseudoVerification, verifyPseudoCode, logoutDevice, renamePseudo } from '../api/client';
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

    // La demande de code en cours est lue depuis /auth/me : c'est elle qui
    // rouvre l'écran de saisie si la page a été rechargée entre-temps.
    const claimMutation = useMutation({
        mutationFn: ({ username, email }: { username: string; email: string }) => requestPseudoVerification(username, email),
        onSuccess: () => invalidate(),
    });

    // En cas de succès, on attend le nouveau /auth/me avant de rendre la
    // main, pour que le menu affiche aussitôt le pseudo vérifié. En cas
    // d'échec aussi : un code expiré ou épuisé n'est plus « en attente ».
    const verifyCodeMutation = useMutation({
        mutationFn: (code: string) => verifyPseudoCode(code),
        onSuccess: () => invalidate(),
        onError: () => invalidate(),
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
        // Sert uniquement à afficher les actions d'admin : le serveur revérifie
        // le droit à chaque appel, à partir du token d'appareil.
        isAdmin: data?.isAdmin ?? false,
        pendingVerification: data?.pendingVerification ?? null,
        isLoading,
        claim: claimMutation.mutateAsync,
        isClaiming: claimMutation.isPending,
        verifyCode: verifyCodeMutation.mutateAsync,
        isVerifyingCode: verifyCodeMutation.isPending,
        logout: logoutMutation.mutateAsync,
        isLoggingOut: logoutMutation.isPending,
        rename: renameMutation.mutateAsync,
        isRenaming: renameMutation.isPending,
    };
}

export function describeIdentityError(err: unknown): string {
    // Les limites de débit répondent en texte brut, sans message exploitable.
    if (err instanceof ApiError && err.status === 429) {
        return 'Trop de tentatives. Réessayez dans quelques minutes.';
    }
    if (err instanceof ApiError) return err.message;
    return 'Une erreur est survenue. Réessayez.';
}

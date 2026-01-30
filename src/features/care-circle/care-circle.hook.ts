import { useCallback, useState } from 'react';
import { careCircleApi, CareCircleConnection, CareCircleInvitation, CreateInvitationPayload } from './care-circle.api';

export function useCareCircle() {
  const [invitations, setInvitations] = useState<CareCircleInvitation[]>([]);
  const [connections, setConnections] = useState<CareCircleConnection[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInvitations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await careCircleApi.getInvitations();
      setInvitations(data);
    } catch (err: any) {
      console.error('[care-circle] fetchInvitations error:', err);
      setError(err.message || 'Failed to fetch invitations');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchConnections = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await careCircleApi.getConnections();
      setConnections(data);
    } catch (err: any) {
      console.error('[care-circle] fetchConnections error:', err);
      setError(err.message || 'Failed to fetch connections');
    } finally {
      setLoading(false);
    }
  }, []);

  const createInvitation = useCallback(async (payload: CreateInvitationPayload) => {
    try {
      setLoading(true);
      setError(null);
      const invitation = await careCircleApi.createInvitation(payload);
      setInvitations((prev) => [invitation, ...prev]);
      return invitation;
    } catch (err: any) {
      console.error('[care-circle] createInvitation error:', err);
      setError(err.message || 'Failed to create invitation');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const acceptInvitation = useCallback(async (invitationId: string) => {
    try {
      setLoading(true);
      setError(null);
      const connection = await careCircleApi.acceptInvitation(invitationId);
      // Remove from invitations and add to connections
      setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId));
      setConnections((prev) => [connection, ...prev]);
      return connection;
    } catch (err: any) {
      console.error('[care-circle] acceptInvitation error:', err);
      setError(err.message || 'Failed to accept invitation');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const rejectInvitation = useCallback(async (invitationId: string) => {
    try {
      setLoading(true);
      setError(null);
      await careCircleApi.rejectInvitation(invitationId);
      // Remove from invitations
      setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId));
    } catch (err: any) {
      console.error('[care-circle] rejectInvitation error:', err);
      setError(err.message || 'Failed to reject invitation');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteConnection = useCallback(async (connectionId: string) => {
    try {
      setLoading(true);
      setError(null);
      await careCircleApi.deleteConnection(connectionId);
      // Remove from connections
      setConnections((prev) => prev.filter((conn) => conn.id !== connectionId));
    } catch (err: any) {
      console.error('[care-circle] deleteConnection error:', err);
      setError(err.message || 'Failed to delete connection');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchInvitations(), fetchConnections()]);
    } finally {
      setRefreshing(false);
    }
  }, [fetchInvitations, fetchConnections]);

  return {
    invitations,
    connections,
    loading,
    refreshing,
    error,
    fetchInvitations,
    fetchConnections,
    createInvitation,
    acceptInvitation,
    rejectInvitation,
    deleteConnection,
    refresh
  };
}

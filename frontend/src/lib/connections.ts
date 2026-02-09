import { useCallback, useEffect, useRef, useState } from "react";
import { apiUrl } from "@/lib/api";
import type { ChannelConnection, ConnectionPlatform } from "@/types";

type ConnectionResponse = { data: ChannelConnection };
type ConnectionsResponse = { data: ChannelConnection[] };

export function useConnections() {
  const [connections, setConnections] = useState<ChannelConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionPlatform, setActionPlatform] = useState<ConnectionPlatform | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchConnections = useCallback(async () => {
    setLoading(true);
    setError(null);
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch(apiUrl("/api/connections"), {
        credentials: "include",
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error("Failed to fetch connections");
      }

      const data = (await response.json()) as ConnectionsResponse;
      setConnections(data.data);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return;
      }
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const updateSingleConnection = useCallback((next: ChannelConnection) => {
    setConnections(prev => {
      const index = prev.findIndex(item => item.platform === next.platform);
      if (index === -1) {
        return [...prev, next];
      }
      const copy = [...prev];
      copy[index] = next;
      return copy;
    });
  }, []);

  const connect = useCallback(async (platform: ConnectionPlatform): Promise<boolean> => {
    setActionPlatform(platform);
    setError(null);
    try {
      const response = await fetch(apiUrl(`/api/connections/${platform}/connect`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Failed to connect");
      }

      const data = (await response.json()) as ConnectionResponse;
      updateSingleConnection(data.data);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      return false;
    } finally {
      setActionPlatform(null);
    }
  }, [updateSingleConnection]);

  const disconnect = useCallback(async (platform: ConnectionPlatform): Promise<boolean> => {
    setActionPlatform(platform);
    setError(null);
    try {
      const response = await fetch(apiUrl(`/api/connections/${platform}/disconnect`), {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Failed to disconnect");
      }

      const data = (await response.json()) as ConnectionResponse;
      updateSingleConnection(data.data);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      return false;
    } finally {
      setActionPlatform(null);
    }
  }, [updateSingleConnection]);

  return {
    connections,
    loading,
    error,
    actionPlatform,
    connect,
    disconnect,
    refetch: fetchConnections,
  };
}

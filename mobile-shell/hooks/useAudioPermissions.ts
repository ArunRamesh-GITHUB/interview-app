import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { initializeAudioPermissions } from '../utils/permissions';

export interface AudioPermissionState {
  hasPermission: boolean | null;
  isLoading: boolean;
  error: string | null;
  requestPermission: () => Promise<boolean>;
}

export function useAudioPermissions(): AudioPermissionState {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const requestPermission = async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const granted = await initializeAudioPermissions();
      setHasPermission(granted);
      setIsLoading(false);
      return granted;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      setHasPermission(false);
      setIsLoading(false);
      return false;
    }
  };

  useEffect(() => {
    // Auto-request permissions on mount
    requestPermission();
  }, []);

  return {
    hasPermission,
    isLoading,
    error,
    requestPermission,
  };
}
import { useEffect, useState } from 'react';
import { api, type SalonSettings } from '@/lib/api';
import { DEFAULT_SETTINGS } from '@/lib/constants';

export function useSalonSettings() {
  const [settings, setSettings] = useState<SalonSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchSettings = async () => {
      try {
        const data = await api.settings.get();
        if (!cancelled) {
          setSettings(data || DEFAULT_SETTINGS);
        }
      } catch {
        if (!cancelled) setSettings(DEFAULT_SETTINGS);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchSettings();
    return () => { cancelled = true; };
  }, []);

  return { settings, loading };
}

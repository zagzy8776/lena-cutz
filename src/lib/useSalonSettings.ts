import { useEffect, useState } from 'react';
import { supabase, type SalonSettings } from '@/lib/supabase';
import { DEFAULT_SETTINGS } from '@/lib/constants';

export function useSalonSettings() {
  const [settings, setSettings] = useState<SalonSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchSettings = async () => {
      const { data } = await supabase
        .from('salon_settings')
        .select('*')
        .eq('id', 1)
        .maybeSingle();

      if (!cancelled) {
        setSettings(data || DEFAULT_SETTINGS);
        setLoading(false);
      }
    };

    fetchSettings();
    return () => {
      cancelled = true;
    };
  }, []);

  return { settings, loading };
}

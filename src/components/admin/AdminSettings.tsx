import { useEffect, useState } from 'react';
import { Save, Loader2, Building2, Phone, Mail, MapPin, Instagram, MessageCircle, Clock, Check } from 'lucide-react';
import { api, type SalonSettings } from '@/lib/api';
import { DEFAULT_SETTINGS } from '@/lib/constants';

export default function AdminSettings() {
  const [settings, setSettings] = useState<SalonSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await api.settings.get();
        setSettings(data || DEFAULT_SETTINGS);
      } catch {
        setSettings(DEFAULT_SETTINGS);
      }
      setLoading(false);
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    setSaved(false);
    try {
      await api.settings.update(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
    }
    setSaving(false);
  };

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-gold-500" />
      </div>
    );
  }

  const update = (field: keyof SalonSettings, value: string) => {
    setSettings({ ...settings, [field]: value });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-3xl text-ink-50">Settings</h2>
          <p className="mt-1 text-ink-400">Update your salon info, contact, and payment details</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-gold !py-2.5">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Changes
        </button>
      </div>

      {saved && (
        <div className="flex items-center gap-2 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400 animate-fade-in">
          <Check className="h-4 w-4" />
          Settings saved successfully!
        </div>
      )}

      {/* Salon Info */}
      <SettingsSection title="Salon Information" icon={Building2}>
        <Field label="Salon Name" value={settings.salon_name} onChange={(v) => update('salon_name', v)} />
        <Field label="Location" value={settings.location} onChange={(v) => update('location', v)} icon={MapPin} />
      </SettingsSection>

      {/* Contact */}
      <SettingsSection title="Contact Details" icon={Phone}>
        <Field label="Phone Number" value={settings.phone} onChange={(v) => update('phone', v)} icon={Phone} />
        <Field label="Email" value={settings.email} onChange={(v) => update('email', v)} icon={Mail} />
      </SettingsSection>

      {/* Social */}
      <SettingsSection title="Social Media" icon={Instagram}>
        <Field label="Instagram URL" value={settings.instagram} onChange={(v) => update('instagram', v)} icon={Instagram} />
        <Field label="WhatsApp Link" value={settings.whatsapp} onChange={(v) => update('whatsapp', v)} icon={MessageCircle} />
      </SettingsSection>

      {/* Bank Details */}
      <SettingsSection title="Bank Account Details" icon={Building2}>
        <p className="mb-4 text-sm text-ink-400">
          These details show on the booking confirmation so customers can pay via transfer.
        </p>
        <Field label="Bank Name" value={settings.bank_name || ''} onChange={(v) => update('bank_name', v)} />
        <Field label="Account Name" value={settings.account_name || ''} onChange={(v) => update('account_name', v)} />
        <Field label="Account Number" value={settings.account_number || ''} onChange={(v) => update('account_number', v)} />
      </SettingsSection>

      {/* Opening Hours */}
      <SettingsSection title="Opening Hours" icon={Clock}>
        <Field label="Monday – Friday" value={settings.mon_fri_hours} onChange={(v) => update('mon_fri_hours', v)} />
        <Field label="Saturday" value={settings.sat_hours} onChange={(v) => update('sat_hours', v)} />
        <Field label="Sunday" value={settings.sun_hours} onChange={(v) => update('sun_hours', v)} />
      </SettingsSection>

      {/* Save button at bottom */}
      <div className="flex justify-end">
        <button onClick={handleSave} disabled={saving} className="btn-gold !py-2.5">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save All Changes
        </button>
      </div>
    </div>
  );
}

function SettingsSection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-ink-700 bg-ink-900 p-6">
      <h3 className="mb-4 flex items-center gap-2 font-display text-xl text-ink-50">
        <Icon className="h-5 w-5 text-gold-500" />
        {title}
      </h3>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  icon: Icon,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-ink-300">{label}</label>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
        )}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full rounded-xl border border-ink-600 bg-ink-950 py-3 text-ink-100 outline-none transition-colors focus:border-gold-500 ${
            Icon ? 'pl-10 pr-4' : 'px-4'
          }`}
        />
      </div>
    </div>
  );
}

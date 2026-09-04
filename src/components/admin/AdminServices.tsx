import { useEffect, useState } from 'react';
import { Save, Loader2, Plus, Trash2, Eye, EyeOff, Scissors } from 'lucide-react';
import { supabase, type Service } from '@/lib/supabase';
import { formatPrice } from '@/lib/constants';

const serviceImages: Record<string, string> = {
  'Low Cut': 'https://images.pexels.com/photos/7447151/pexels-photo-7447151.jpeg?auto=compress&cs=tinysrgb&w=800',
  'High Fade': 'https://images.pexels.com/photos/12464841/pexels-photo-12464841.jpeg?auto=compress&cs=tinysrgb&w=800',
  'Buzz Cut': 'https://images.pexels.com/photos/4625632/pexels-photo-4625632.jpeg?auto=compress&cs=tinysrgb&w=800',
  'Taper Fade': 'https://images.pexels.com/photos/12464840/pexels-photo-12464840.jpeg?auto=compress&cs=tinysrgb&w=800',
  '3 Step': 'https://images.pexels.com/photos/9971240/pexels-photo-9971240.jpeg?auto=compress&cs=tinysrgb&w=800',
};

export default function AdminServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  // New service form
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newDuration, setNewDuration] = useState('30');

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    const { data } = await supabase
      .from('services')
      .select('*')
      .order('sort_order', { ascending: true });
    setServices(data || []);
    setLoading(false);
  };

  const updateService = async (id: string, updates: Partial<Service>) => {
    setSaving(id);
    setSaved(null);

    const { error } = await supabase
      .from('services')
      .update(updates)
      .eq('id', id);

    if (!error) {
      setServices((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
      setSaved(id);
      setTimeout(() => setSaved(null), 2000);
    }
    setSaving(null);
  };

  const toggleActive = async (service: Service) => {
    await updateService(service.id, { is_active: !service.is_active });
  };

  const addService = async () => {
    if (!newName.trim() || !newPrice.trim()) return;

    setSaving('new');
    const maxSort = Math.max(...services.map((s) => s.sort_order), 0);

    const { data, error } = await supabase
      .from('services')
      .insert({
        name: newName.trim(),
        description: newDesc.trim() || null,
        price: parseFloat(newPrice),
        duration_minutes: parseInt(newDuration) || 30,
        sort_order: maxSort + 1,
        is_active: true,
      })
      .select()
      .single();

    if (!error && data) {
      setServices((prev) => [...prev, data]);
      setNewName('');
      setNewDesc('');
      setNewPrice('');
      setNewDuration('30');
      setShowAdd(false);
    }
    setSaving(null);
  };

  const deleteService = async (id: string) => {
    if (!confirm('Delete this service? Existing bookings will keep their records.')) return;
    setSaving(id);
    const { error } = await supabase.from('services').delete().eq('id', id);
    if (!error) {
      setServices((prev) => prev.filter((s) => s.id !== id));
    }
    setSaving(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-gold-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-3xl text-ink-50">Services</h2>
          <p className="mt-1 text-ink-400">Edit prices, descriptions, and availability</p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="btn-gold !py-2.5"
        >
          <Plus className="h-4 w-4" />
          Add Service
        </button>
      </div>

      {/* Add new service form */}
      {showAdd && (
        <div className="rounded-2xl border border-gold-500/30 bg-ink-900 p-6 animate-fade-in">
          <h3 className="mb-4 font-display text-xl text-ink-50">New Service</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-ink-300">Name *</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Skin Fade"
                className="w-full rounded-xl border border-ink-600 bg-ink-950 px-4 py-2.5 text-ink-100 placeholder-ink-500 outline-none focus:border-gold-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-ink-300">Price (NGN) *</label>
              <input
                type="number"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder="e.g. 2000"
                className="w-full rounded-xl border border-ink-600 bg-ink-950 px-4 py-2.5 text-ink-100 placeholder-ink-500 outline-none focus:border-gold-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-ink-300">Duration (minutes)</label>
              <input
                type="number"
                value={newDuration}
                onChange={(e) => setNewDuration(e.target.value)}
                className="w-full rounded-xl border border-ink-600 bg-ink-950 px-4 py-2.5 text-ink-100 outline-none focus:border-gold-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-ink-300">Description</label>
              <input
                type="text"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Short description"
                className="w-full rounded-xl border border-ink-600 bg-ink-950 px-4 py-2.5 text-ink-100 placeholder-ink-500 outline-none focus:border-gold-500"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button onClick={() => setShowAdd(false)} className="btn-outline !py-2.5">
              Cancel
            </button>
            <button onClick={addService} disabled={saving === 'new'} className="btn-gold !py-2.5">
              {saving === 'new' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Service
            </button>
          </div>
        </div>
      )}

      {/* Services list */}
      <div className="space-y-4">
        {services.map((service) => (
          <ServiceEditCard
            key={service.id}
            service={service}
            saving={saving === service.id}
            saved={saved === service.id}
            onSave={updateService}
            onToggleActive={toggleActive}
            onDelete={deleteService}
          />
        ))}
      </div>
    </div>
  );
}

function ServiceEditCard({
  service,
  saving,
  saved,
  onSave,
  onToggleActive,
  onDelete,
}: {
  service: Service;
  saving: boolean;
  saved: boolean;
  onSave: (id: string, updates: Partial<Service>) => void;
  onToggleActive: (service: Service) => void;
  onDelete: (id: string) => void;
}) {
  const [price, setPrice] = useState(service.price.toString());
  const [duration, setDuration] = useState(service.duration_minutes.toString());
  const [description, setDescription] = useState(service.description || '');
  const [name, setName] = useState(service.name);

  const hasChanges =
    price !== service.price.toString() ||
    duration !== service.duration_minutes.toString() ||
    description !== (service.description || '') ||
    name !== service.name;

  const handleSave = () => {
    onSave(service.id, {
      price: parseFloat(price) || 0,
      duration_minutes: parseInt(duration) || 30,
      description: description.trim() || null,
      name: name.trim(),
    });
  };

  return (
    <div className={`rounded-2xl border bg-ink-900 p-5 transition-all duration-300 ${
      service.is_active ? 'border-ink-700' : 'border-ink-800 opacity-60'
    }`}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        {/* Image preview */}
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-ink-700">
          <img
            src={serviceImages[service.name] || service.image_url || ''}
            alt={service.name}
            className="h-full w-full object-cover"
          />
        </div>

        {/* Editable fields */}
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2">
            <Scissors className="h-4 w-4 text-gold-500" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 rounded-lg border border-ink-600 bg-ink-950 px-3 py-2 text-ink-100 outline-none focus:border-gold-500"
            />
            <button
              onClick={() => onToggleActive(service)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                service.is_active
                  ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                  : 'bg-ink-700 text-ink-400 hover:bg-ink-600'
              }`}
            >
              {service.is_active ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              {service.is_active ? 'Visible' : 'Hidden'}
            </button>
          </div>

          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            className="w-full rounded-lg border border-ink-600 bg-ink-950 px-3 py-2 text-sm text-ink-200 placeholder-ink-500 outline-none focus:border-gold-500"
          />

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-xs text-ink-400">Price:</label>
              <div className="flex items-center gap-1">
                <span className="text-xs text-ink-500">₦</span>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-24 rounded-lg border border-ink-600 bg-ink-950 px-3 py-1.5 text-sm text-ink-100 outline-none focus:border-gold-500"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-ink-400">Duration:</label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-20 rounded-lg border border-ink-600 bg-ink-950 px-3 py-1.5 text-sm text-ink-100 outline-none focus:border-gold-500"
              />
              <span className="text-xs text-ink-500">min</span>
            </div>
            <div className="text-sm text-ink-400">
              Current: {formatPrice(Number(service.price))} • {service.duration_minutes} min
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {saved && (
            <span className="flex items-center gap-1 text-xs text-green-400">
              <Save className="h-3.5 w-3.5" />
              Saved!
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="flex items-center gap-1.5 rounded-full bg-gold-500 px-4 py-2 text-xs font-semibold text-ink-950 transition-colors hover:bg-gold-400 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save
          </button>
          <button
            onClick={() => onDelete(service.id)}
            className="flex items-center gap-1.5 rounded-full border border-ink-600 px-3 py-2 text-xs font-semibold text-ink-400 transition-colors hover:border-red-500 hover:text-red-400"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

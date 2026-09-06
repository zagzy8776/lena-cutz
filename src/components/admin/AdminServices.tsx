import { ChangeEvent, ReactNode, useEffect, useState } from 'react';
import { Save, Loader2, Plus, Trash2, Eye, EyeOff, Scissors, Pencil, FolderOpen, Upload, Image as ImageIcon, X } from 'lucide-react';
import { api, type Category, type Service } from '@/lib/api';
import { formatPrice } from '@/lib/constants';

const serviceImages: Record<string, string> = {
  'Low Cut': 'https://images.pexels.com/photos/7447151/pexels-photo-7447151.jpeg?auto=compress&cs=tinysrgb&w=800',
  'High Fade': 'https://images.pexels.com/photos/12464841/pexels-photo-12464841.jpeg?auto=compress&cs=tinysrgb&w=800',
  'Buzz Cut': 'https://images.pexels.com/photos/4625632/pexels-photo-4625632.jpeg?auto=compress&cs=tinysrgb&w=800',
  'Taper Fade': 'https://images.pexels.com/photos/12464840/pexels-photo-12464840.jpeg?auto=compress&cs=tinysrgb&w=800',
  '3 Step': 'https://images.pexels.com/photos/9971240/pexels-photo-9971240.jpeg?auto=compress&cs=tinysrgb&w=800',
};

const imageToDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
  if (!file.type.startsWith('image/')) return reject(new Error('Please choose an image file.'));
  if (file.size > 650 * 1024) return reject(new Error('Please choose an image under 650 KB.'));
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result));
  reader.onerror = () => reject(new Error('Could not read the image.'));
  reader.readAsDataURL(file);
});

export default function AdminServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [categoryEditName, setCategoryEditName] = useState('');
  const [categorySaving, setCategorySaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newDuration, setNewDuration] = useState('30');
  const [newCategory, setNewCategory] = useState('');
  const [newImage, setNewImage] = useState<string | null>(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [serviceData, categoryData] = await Promise.all([api.services.getAll(), api.categories.getAll()]);
      setServices(serviceData);
      setCategories(categoryData);
      if (!newCategory && categoryData[0]) setNewCategory(categoryData[0].id);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Unable to load services.');
    } finally { setLoading(false); }
  };

  const notify = (text: string) => { setMessage(text); setTimeout(() => setMessage(null), 3000); };

  const addCategory = async () => {
    const name = categoryName.trim();
    if (!name) return;
    setCategorySaving(true);
    try {
      const category = await api.categories.create(name);
      setCategories(prev => [...prev, category].sort((a,b) => a.name.localeCompare(b.name)));
      setCategoryName('');
      if (!newCategory) setNewCategory(category.id);
      notify('Category created.');
    } catch (err) { notify(err instanceof Error ? err.message : 'Could not create category.'); }
    setCategorySaving(false);
  };

  const saveCategory = async (id: string) => {
    const name = categoryEditName.trim();
    if (!name) return;
    setCategorySaving(true);
    try {
      const updated = await api.categories.update(id, name);
      setCategories(prev => prev.map(c => c.id === id ? { ...c, ...updated } : c));
      setServices(prev => prev.map(s => s.category_id === id ? { ...s, category_name: updated.name } : s));
      setEditingCategory(null);
      notify('Category updated.');
    } catch (err) { notify(err instanceof Error ? err.message : 'Could not update category.'); }
    setCategorySaving(false);
  };

  const deleteCategory = async (category: Category) => {
    if ((category.service_count || 0) > 0) { notify('Move or delete the services in this category first.'); return; }
    if (!confirm(`Delete “${category.name}”?`)) return;
    setCategorySaving(true);
    try {
      await api.categories.delete(category.id);
      setCategories(prev => prev.filter(c => c.id !== category.id));
      if (newCategory === category.id) setNewCategory('');
      notify('Category deleted.');
    } catch (err) { notify(err instanceof Error ? err.message : 'Could not delete category.'); }
    setCategorySaving(false);
  };

  const updateService = async (id: string, updates: Partial<Service>) => {
    setSaving(id); setSaved(null);
    try {
      const updated = await api.services.update(id, updates);
      setServices(prev => prev.map(s => s.id === id ? { ...s, ...updated } : s));
      setSaved(id); setTimeout(() => setSaved(null), 2000);
    } catch (err) { notify(err instanceof Error ? err.message : 'Could not save service.'); }
    setSaving(null);
  };

  const addService = async () => {
    if (!newName.trim() || !newPrice.trim()) { notify('Service name and price are required.'); return; }
    setSaving('new');
    const maxSort = Math.max(...services.map(s => s.sort_order), 0);
    try {
      const data = await api.services.create({ name: newName.trim(), description: newDesc.trim() || null, price: parseFloat(newPrice), duration_minutes: parseInt(newDuration) || 30, sort_order: maxSort + 1, is_active: true, category_id: newCategory || null, image_url: newImage });
      setServices(prev => [...prev, data]);
      setNewName(''); setNewDesc(''); setNewPrice(''); setNewDuration('30'); setNewImage(null);
      setShowAdd(false); notify('Service added to the website.');
    } catch (err) { notify(err instanceof Error ? err.message : 'Could not add service.'); }
    setSaving(null);
  };

  const deleteService = async (id: string) => {
    if (!confirm('Delete this service? Existing bookings will keep their records.')) return;
    setSaving(id);
    try { await api.services.delete(id); setServices(prev => prev.filter(s => s.id !== id)); notify('Service deleted.'); }
    catch (err) { notify(err instanceof Error ? err.message : 'Could not delete service.'); }
    setSaving(null);
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-gold-500" /></div>;

  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-500">Content manager</span><h2 className="mt-1 font-display text-3xl text-ink-50">Services & Categories</h2><p className="mt-1 text-ink-400">Manage what customers see without needing a developer.</p></div><button onClick={() => setShowAdd(!showAdd)} className="btn-gold !py-2.5"><Plus className="h-4 w-4" /> Add Service</button></div>
      {message && <div className="rounded-xl border border-gold-500/30 bg-gold-500/10 px-4 py-3 text-sm text-gold-300">{message}</div>}

      <section className="rounded-2xl border border-ink-700 bg-ink-900 p-5 sm:p-6">
        <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-500/10 text-gold-500"><FolderOpen className="h-5 w-5" /></div><div><h3 className="font-display text-xl text-ink-50">Categories</h3><p className="text-sm text-ink-400">Create categories such as Haircuts, Braids, Nails or Makeup.</p></div></div>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row"><input value={categoryName} onChange={e => setCategoryName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCategory()} placeholder="New category name" className="flex-1 rounded-xl border border-ink-600 bg-ink-950 px-4 py-2.5 text-ink-100 outline-none focus:border-gold-500" /><button onClick={addCategory} disabled={categorySaving} className="btn-outline !py-2.5"><Plus className="h-4 w-4" /> Add Category</button></div>
        <div className="mt-4 flex flex-wrap gap-2">{categories.map(category => <div key={category.id} className="flex items-center gap-2 rounded-full border border-ink-600 bg-ink-950 px-3 py-2 text-sm text-ink-200">{editingCategory === category.id ? <><input autoFocus value={categoryEditName} onChange={e => setCategoryEditName(e.target.value)} className="w-32 bg-transparent outline-none" /><button onClick={() => saveCategory(category.id)} className="text-gold-400" disabled={categorySaving}><Save className="h-4 w-4" /></button><button onClick={() => setEditingCategory(null)} className="text-ink-500"><X className="h-4 w-4" /></button></> : <><span>{category.name}</span><span className="text-xs text-ink-500">{category.service_count || 0}</span><button onClick={() => { setEditingCategory(category.id); setCategoryEditName(category.name); }} className="text-ink-500 hover:text-gold-400"><Pencil className="h-3.5 w-3.5" /></button><button onClick={() => deleteCategory(category)} className="text-ink-500 hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></button></>}</div>)}{!categories.length && <p className="text-sm text-ink-500">No categories yet. Create one above.</p>}</div>
      </section>

      {showAdd && <section className="rounded-2xl border border-gold-500/30 bg-ink-900 p-6 animate-fade-in"><h3 className="font-display text-xl text-ink-50">New Service</h3><p className="mt-1 text-sm text-ink-400">Add the details and photo. It will appear on the public website after saving.</p><div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2"><Field label="Service name *"><input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Skin Fade" className={inputClass} /></Field><Field label="Category"><select value={newCategory} onChange={e => setNewCategory(e.target.value)} className={inputClass}><option value="">No category</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field><Field label="Price (NGN) *"><input type="number" value={newPrice} onChange={e => setNewPrice(e.target.value)} placeholder="e.g. 5000" className={inputClass} /></Field><Field label="Duration (minutes)"><input type="number" value={newDuration} onChange={e => setNewDuration(e.target.value)} className={inputClass} /></Field><Field label="Description"><input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Short description" className={inputClass} /></Field><Field label="Service photo"><ImagePicker value={newImage} onChange={setNewImage} onError={notify} /></Field></div><div className="mt-5 flex gap-3"><button onClick={() => setShowAdd(false)} className="btn-outline !py-2.5">Cancel</button><button onClick={addService} disabled={saving === 'new'} className="btn-gold !py-2.5">{saving === 'new' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Service</button></div></section>}

      <div className="space-y-4">{services.map(service => <ServiceEditCard key={service.id} service={service} categories={categories} saving={saving === service.id} saved={saved === service.id} onSave={updateService} onToggleActive={service => updateService(service.id, { is_active: !service.is_active })} onDelete={deleteService} onNotify={notify} />)}{!services.length && <div className="rounded-2xl border border-ink-700 bg-ink-900 py-16 text-center text-ink-400">No services yet. Use “Add Service” above.</div>}</div>
    </div>
  );
}

const inputClass = 'w-full rounded-xl border border-ink-600 bg-ink-950 px-4 py-2.5 text-ink-100 placeholder-ink-500 outline-none focus:border-gold-500';
function Field({ label, children }: { label: string; children: ReactNode }) { return <div><label className="mb-1.5 block text-sm text-ink-300">{label}</label>{children}</div>; }

function ImagePicker({ value, onChange, onError }: { value: string | null; onChange: (value: string | null) => void; onError: (message: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const handleChange = async (event: ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (!file) return; setUploading(true); try { onChange(await imageToDataUrl(file)); } catch (err) { onError(err instanceof Error ? err.message : 'Could not upload image.'); } setUploading(false); event.target.value = ''; };
  return <div className="flex items-center gap-3"><label className="flex h-16 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-ink-600 bg-ink-950 text-sm text-ink-400 hover:border-gold-500 hover:text-gold-400"><input type="file" accept="image/*" onChange={handleChange} className="hidden" />{uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}{value ? 'Change photo' : 'Upload photo'}</label>{value && <img src={value} alt="Preview" className="h-16 w-16 rounded-xl object-cover" />}{value && <button type="button" onClick={() => onChange(null)} className="text-ink-500 hover:text-red-400"><X className="h-4 w-4" /></button>}</div>;
}

function ServiceEditCard({ service, categories, saving, saved, onSave, onToggleActive, onDelete, onNotify }: { service: Service; categories: Category[]; saving: boolean; saved: boolean; onSave: (id: string, updates: Partial<Service>) => void; onToggleActive: (service: Service) => void; onDelete: (id: string) => void; onNotify: (message: string) => void }) {
  const [price, setPrice] = useState(service.price.toString());
  const [duration, setDuration] = useState(service.duration_minutes.toString());
  const [description, setDescription] = useState(service.description || '');
  const [name, setName] = useState(service.name);
  const [categoryId, setCategoryId] = useState(service.category_id || '');
  const [image, setImage] = useState(service.image_url || serviceImages[service.name] || null);
  const [imageError, setImageError] = useState<string | null>(null);
  const hasChanges = price !== service.price.toString() || duration !== service.duration_minutes.toString() || description !== (service.description || '') || name !== service.name || categoryId !== (service.category_id || '') || image !== (service.image_url || serviceImages[service.name] || null);
  const handleSave = () => onSave(service.id, { price: parseFloat(price) || 0, duration_minutes: parseInt(duration) || 30, description: description.trim() || null, name: name.trim(), category_id: categoryId || null, image_url: image });
  const handleImage = async (file: File) => { setImageError(null); try { setImage(await imageToDataUrl(file)); } catch (err) { const text = err instanceof Error ? err.message : 'Could not upload image.'; setImageError(text); onNotify(text); } };
  return <div className={`rounded-2xl border bg-ink-900 p-5 transition-all duration-300 ${service.is_active ? 'border-ink-700' : 'border-ink-800 opacity-60'}`}><div className="flex flex-col gap-5 xl:flex-row xl:items-start"><div className="relative h-28 w-full shrink-0 overflow-hidden rounded-xl border border-ink-700 bg-ink-950 xl:h-24 xl:w-28">{image ? <img src={image} alt={service.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-ink-600"><ImageIcon className="h-7 w-7" /></div>}<label className="absolute inset-x-2 bottom-2 flex cursor-pointer items-center justify-center gap-1 rounded-lg bg-ink-950/90 py-1.5 text-[11px] font-medium text-ink-200 hover:text-gold-400"><input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleImage(f); e.target.value = ''; }} /><Upload className="h-3 w-3" /> Change photo</label></div><div className="flex-1 space-y-3"><div className="flex flex-col gap-2 sm:flex-row sm:items-center"><Scissors className="hidden h-4 w-4 text-gold-500 sm:block" /><input type="text" value={name} onChange={e => setName(e.target.value)} className="flex-1 rounded-lg border border-ink-600 bg-ink-950 px-3 py-2 text-ink-100 outline-none focus:border-gold-500" /><button onClick={() => onToggleActive(service)} className={`flex w-fit items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${service.is_active ? 'bg-green-500/10 text-green-400' : 'bg-ink-700 text-ink-400'}`}>{service.is_active ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}{service.is_active ? 'Visible' : 'Hidden'}</button></div><select value={categoryId} onChange={e => setCategoryId(e.target.value)} className={inputClass}><option value="">No category</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select><input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" className={`${inputClass} text-sm`} /><div className="flex flex-wrap items-center gap-4"><label className="flex items-center gap-2 text-xs text-ink-400">Price <span className="text-ink-500">₦</span><input type="number" value={price} onChange={e => setPrice(e.target.value)} className="w-24 rounded-lg border border-ink-600 bg-ink-950 px-3 py-1.5 text-sm text-ink-100 outline-none focus:border-gold-500" /></label><label className="flex items-center gap-2 text-xs text-ink-400">Duration <input type="number" value={duration} onChange={e => setDuration(e.target.value)} className="w-20 rounded-lg border border-ink-600 bg-ink-950 px-3 py-1.5 text-sm text-ink-100 outline-none focus:border-gold-500" /> min</label><span className="text-sm text-ink-500">Current: {formatPrice(Number(service.price))} • {service.duration_minutes} min</span></div>{imageError && <p className="text-xs text-red-400">{imageError}</p>}</div><div className="flex items-center gap-2 xl:pt-1">{saved && <span className="flex items-center gap-1 text-xs text-green-400"><Save className="h-3.5 w-3.5" /> Saved</span>}<button onClick={handleSave} disabled={!hasChanges || saving} className="flex items-center gap-1.5 rounded-full bg-gold-500 px-4 py-2 text-xs font-semibold text-ink-950 disabled:cursor-not-allowed disabled:opacity-40">{saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Save</button><button onClick={() => onDelete(service.id)} className="flex items-center gap-1.5 rounded-full border border-ink-600 px-3 py-2 text-xs font-semibold text-ink-400 hover:border-red-500 hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></button></div></div></div>;
}

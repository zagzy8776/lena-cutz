// Central API client. Set VITE_API_URL to override the deployed Express API URL.
const configuredBaseUrl = (import.meta.env.VITE_API_URL || '').trim().replace(/\/$/, '');
const BASE_URL = configuredBaseUrl || (import.meta.env.DEV ? 'http://localhost:3001' : 'https://lena-cutz.onrender.com');

export function getToken(): string | null { return localStorage.getItem('lena_cutz_admin_token'); }
export function setToken(token: string) { localStorage.setItem('lena_cutz_admin_token', token); }
export function clearToken() { localStorage.removeItem('lena_cutz_admin_token'); }
function authHeaders(): Record<string,string> { const token=getToken(); return token?{Authorization:`Bearer ${token}`} : {}; }

async function request<T>(path:string, options:RequestInit={}):Promise<T>{
 const res=await fetch(`${BASE_URL}${path}`,{...options,headers:{Accept:'application/json','Content-Type':'application/json',...authHeaders(),...options.headers}});
 const data=await res.json().catch(()=>null);
 if(!res.ok) throw new Error(data?.error||`Request failed (${res.status})`);
 return data as T;
}

export type Category={id:string;name:string;created_at:string;service_count?:number};
export type Service={id:string;name:string;description:string|null;duration_minutes:number;price:number|string;image_url:string|null;sort_order:number;is_active:boolean;created_at:string;category_id:string|null;category_name?:string|null};
export type BookingStatus='pending'|'confirmed'|'cancelled'|'completed';
export type Booking={id:string;service_id:string;customer_name:string;customer_phone:string;customer_email:string|null;booking_date:string;booking_time:string;status:BookingStatus;notes:string|null;created_at:string};
export type BookingWithService=Booking&{services:Service|null};
export type SalonSettings={id:number;salon_name:string;phone:string;email:string;location:string;instagram:string;whatsapp:string;bank_name:string|null;account_name:string|null;account_number:string|null;mon_fri_hours:string;sat_hours:string;sun_hours:string;updated_at:string};
export type Session={token:string;email:string};
export type Availability={date:string;booked_slots:string[]};

export const api={
 auth:{
  signInWithPassword:async({email,password}:{email:string;password:string}):Promise<{session:Session}>=>{const data=await request<Session>('/api/auth/login',{method:'POST',body:JSON.stringify({email,password})});setToken(data.token);return{session:data};},
  signOut:()=>{clearToken();return Promise.resolve();},
  getSession:():{session:Session|null}=>{const token=getToken();if(!token)return{session:null};try{const payload=JSON.parse(atob(token.split('.')[1]));if(!payload?.exp||payload.exp*1000<Date.now()){clearToken();return{session:null};}return{session:{token,email:payload.email}}}catch{clearToken();return{session:null}}},
  changePassword:(currentPassword:string,newPassword:string)=>request<{message:string}>('/api/auth/change-password',{method:'POST',body:JSON.stringify({currentPassword,newPassword})}),
 },
 categories:{
  getPublic:()=>request<Category[]>('/api/categories'),
  getAll:()=>request<Category[]>('/api/admin/categories'),
  create:(name:string)=>request<Category>('/api/admin/categories',{method:'POST',body:JSON.stringify({name})}),
  update:(id:string,name:string)=>request<Category>(`/api/admin/categories/${id}`,{method:'PATCH',body:JSON.stringify({name})}),
  delete:(id:string)=>request<{success:boolean}>(`/api/admin/categories/${id}`,{method:'DELETE'}),
 },
 services:{
  getPublic:()=>request<Service[]>('/api/services'),getAll:()=>request<Service[]>('/api/admin/services'),
  create:(data:Partial<Service>)=>request<Service>('/api/admin/services',{method:'POST',body:JSON.stringify(data)}),
  update:(id:string,data:Partial<Service>)=>request<Service>(`/api/admin/services/${id}`,{method:'PATCH',body:JSON.stringify(data)}),
  delete:(id:string)=>request<{success:boolean}>(`/api/admin/services/${id}`,{method:'DELETE'}),
 },
 bookings:{
  create:(data:Partial<Booking>)=>request<Booking>('/api/bookings',{method:'POST',body:JSON.stringify(data)}),
  getAvailability:(date:string,serviceId?:string)=>request<Availability>(`/api/availability?date=${encodeURIComponent(date)}${serviceId?`&service_id=${encodeURIComponent(serviceId)}`:''}`),
  getAll:()=>request<BookingWithService[]>('/api/admin/bookings'),
  updateStatus:(id:string,status:BookingStatus)=>request<Booking>(`/api/admin/bookings/${id}/status`,{method:'PATCH',body:JSON.stringify({status})}),
  delete:(id:string)=>request<{success:boolean}>(`/api/admin/bookings/${id}`,{method:'DELETE'}),
 },
 settings:{get:()=>request<SalonSettings|null>('/api/settings'),update:(data:Partial<SalonSettings>)=>request<SalonSettings>('/api/admin/settings',{method:'PATCH',body:JSON.stringify(data)})},
 overview:{get:()=>request<Record<string,unknown>>('/api/admin/overview')},
 health:()=>request<{status:string;db:string;provider?:string}>('/api/health'),
};

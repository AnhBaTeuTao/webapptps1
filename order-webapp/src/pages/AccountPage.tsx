import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, KeyRound, MapPin, Phone, Mail, LogOut, ChevronRight, ShieldCheck, Plus, Trash2, Pencil, Loader2 } from 'lucide-react';
import { api, ApiError, type AccountProfile } from '../lib/api';
import { resizeImageFile } from '../lib/resizeImage';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

export default function AccountPage() {
  const { session, logout, setSession } = useAuth();
  const { t, errorText } = useLanguage();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [profileForm, setProfileForm] = useState({ name: session?.name || '', company: session?.company || '', taxCode: session?.taxCode || '', email: session?.email || '', address: session?.address || '' });
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileBusy, setProfileBusy] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [addresses, setAddresses] = useState<Awaited<ReturnType<typeof api.addresses>>['addresses']>([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState({ label: '', address: '', contactName: session?.name || '', contactPhone: session?.phone || '', isDefault: false });
  const [addressError, setAddressError] = useState('');
  const [addressBusy, setAddressBusy] = useState(false);
  const addressFailure = (cause: unknown, fallback: string) => cause instanceof ApiError ? errorText(cause) : t(fallback);
  const reloadAddresses = () => api.addresses().then(result => { setAddresses(result.addresses); setAddressError(''); }).catch(cause => setAddressError(addressFailure(cause, 'Không tải được sổ địa chỉ')));
  useEffect(() => { let live = true; api.account().then(({ account }) => { if (live) { setProfile(account); setProfileForm({ name: account.name, company: account.company, taxCode: account.taxCode, email: account.email, address: account.address }); } }).catch(() => undefined); return () => { live = false; }; }, []);
  useEffect(() => { let live = true; api.addresses().then(r => { if (live) setAddresses(r.addresses); }).catch(cause => { if (live) setAddressError(addressFailure(cause, 'Không tải được sổ địa chỉ')); }); return () => { live = false; }; }, []);
  const rows = [
    { icon: Building2, label: t('Công ty / cửa hàng'), value: profile?.company || session?.company || '—' },
    { icon: Phone, label: t('Số điện thoại'), value: session?.phone || '—' },
    { icon: Mail, label: t('Email'), value: session?.email || '—' },
    { icon: MapPin, label: t('Địa chỉ công ty / xuất hóa đơn'), value: profile?.address || session?.address || '—' },
    { icon: MapPin, label: t('Địa chỉ giao hàng mặc định'), value: addresses.find(address => address.isDefault)?.address || session?.defaultShippingAddress?.address || session?.address || '—' },
    { icon: Building2, label: t('Mã số thuế'), value: profile?.taxCode || session?.taxCode || '—' },
  ];
  return <div className="mx-auto max-w-3xl space-y-5 pb-6">
    <header className="flex items-start justify-between gap-3"><div><h1 className="text-2xl font-black text-[#17382a]">{t('Tài khoản của tôi')}</h1></div><button onClick={() => { logout(); navigate('/dang-nhap'); }} className="flex min-h-10 shrink-0 items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3 text-sm font-bold text-rose-700"><LogOut size={16}/>{t('Đăng xuất')}</button></header>
    <section className="overflow-hidden rounded-3xl bg-linear-to-br from-[#0b4f34] to-[#13875b] p-5 text-white shadow-lg sm:p-7">
      <div className="flex items-start justify-between gap-3"><label className="relative flex size-14 cursor-pointer items-center justify-center overflow-hidden rounded-2xl bg-white/15 text-xl font-black">{profile?.avatarUrl ? <img src={profile.avatarUrl} alt={t('Ảnh đại diện')} className="size-full object-cover" /> : (profile?.name || session?.name || 'K').slice(0,1).toUpperCase()}{profileBusy && <span className="absolute inset-0 flex items-center justify-center bg-black/35"><Loader2 size={20} className="animate-spin" /></span>}<input type="file" accept="image/*" className="sr-only" disabled={profileBusy} onChange={async event => {
          const input = event.target;
          const file = input.files?.[0];
          if (!file) return;
          setProfileBusy(true); setProfileError('');
          try {
            // Ảnh chụp điện thoại thường vài MB, vượt giới hạn 2 MB → thu nhỏ trên máy trước khi gửi.
            const small = await resizeImageFile(file, 1024);
            const result = await api.uploadAvatar(small);
            setProfile(result.account);
          } catch (cause) {
            setProfileError(cause instanceof ApiError ? errorText(cause) : t('Không lưu được ảnh đại diện'));
          } finally { setProfileBusy(false); input.value = ''; }
        }} /></label>
        <span className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold">{session?.verificationStatus === 'pending' ? t('Chưa xác minh') : session?.verificationStatus === 'rejected' ? t('Đã từ chối') : t('Đã xác minh')}</span></div>
      <h2 className="mt-4 text-xl font-extrabold">{profile?.name || session?.name || session?.company}</h2><p className="mt-1 text-sm text-white/75">{t('Mã khách hàng')}: <strong className="font-mono text-white">{session?.code}</strong> · {t('Chạm ảnh để đổi')}</p>
    </section>
    <section className="rounded-2xl border border-[#17231d]/10 bg-white p-4 shadow-sm"><div className="flex items-center justify-between"><h3 className="font-bold text-[#17382a]">{t('Hồ sơ')}</h3><button type="button" onClick={() => setEditingProfile(value => !value)} className="text-sm font-bold text-[#0f7a4f]">{t(editingProfile ? 'Đóng' : 'Chỉnh sửa')}</button></div>
      {editingProfile && <form className="mt-3 grid gap-3" onSubmit={async event => { event.preventDefault(); setProfileBusy(true); setProfileError(''); try { const result = await api.saveAccount(profileForm); setProfile(result.account); if (session) setSession({ ...session, name: result.account.name, email: result.account.email, address: result.account.address }); setEditingProfile(false); } catch { setProfileError(t('Không lưu được hồ sơ')); } finally { setProfileBusy(false); } }}>{([['name','Tên người liên hệ'],['email','Email liên hệ'],['company','Tên công ty / cửa hàng'],['taxCode','Mã số thuế'],['address','Địa chỉ công ty / xuất hóa đơn']] as const).map(([key,label]) => <label key={key} className="text-xs font-semibold text-[#53695c]">{t(label)}<input type={key === 'email' ? 'email' : 'text'} required={key === 'name' || key === 'company'} value={profileForm[key]} onChange={event => setProfileForm(form => ({ ...form, [key]: event.target.value }))} className="mt-1 h-11 w-full rounded-lg border border-[#d7e3d9] px-3 text-sm" /></label>)}<p className="text-xs text-[#718579]">{t('Tên công ty/MST cần TPS1 duyệt')}</p><button disabled={profileBusy} className="min-h-11 rounded-lg bg-[#0f7a4f] font-bold text-white disabled:opacity-50">{t('Lưu hồ sơ')}</button></form>}
      {profile?.request?.status === 'pending' && <p className="mt-3 rounded-lg bg-amber-50 p-2 text-xs text-amber-900">{t('Tên công ty/MST đang chờ duyệt')}: {profile.request.company} · {profile.request.tax_code || '—'}</p>}
      {profile?.request?.status === 'rejected' && <p className="mt-3 text-xs text-rose-700">{t('Yêu cầu thay đổi đã bị từ chối')}</p>}
      {profileError && <p className="mt-2 text-sm text-rose-700">{profileError}</p>}
    </section>
    <section className="rounded-2xl border border-[#17231d]/10 bg-white p-4 shadow-sm">
      <h3 className="font-bold text-[#17382a]">{t('Tên đăng nhập')}</h3>
      <p className="mt-1 text-sm font-semibold text-[#263e31]">{profile?.username || '—'}</p>
    </section>
    <section className="overflow-hidden rounded-2xl border border-[#17231d]/10 bg-white shadow-sm"><h3 className="border-b border-[#17231d]/8 px-4 py-3 text-sm font-bold text-[#17382a]">{t('Thông tin khách hàng')}</h3>
      {rows.map(({icon: Icon,label,value}) => <div key={label} className="flex gap-3 border-b border-[#17231d]/5 px-4 py-3.5 last:border-0"><span className="mt-0.5 text-[#0f7a4f]"><Icon size={18}/></span><div className="min-w-0"><p className="text-xs text-[#75857b]">{label}</p><p className="mt-0.5 break-words text-sm font-semibold text-[#263e31]">{value}</p></div></div>)}
    </section>
    <section className="space-y-3 rounded-2xl border border-[#17231d]/10 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between"><h3 className="font-bold text-[#17382a]">{t('Sổ địa chỉ')}</h3><button onClick={()=>{setEditingAddressId(null);setAddressForm({label:'',address:'',contactName:profile?.name||session?.name||'',contactPhone:session?.phone||'',isDefault:false});setShowAddressForm(true);}} className="flex min-h-10 items-center gap-1 rounded-lg bg-[#eaf6ef] px-3 text-sm font-bold text-[#0f7a4f]"><Plus size={16}/>{t('Thêm địa chỉ')}</button></div>
      {addresses.map(a=><div key={a.id} className="rounded-xl border border-[#e2eae4] p-3"><div className="flex items-start gap-2"><MapPin size={17} className="mt-0.5 text-[#0f7a4f]"/><div className="min-w-0 flex-1"><p className="font-bold text-[#263e31]">{a.label} {a.isDefault&&<span className="ml-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] text-emerald-700">{t('Mặc định')}</span>}</p><p className="mt-1 text-sm text-[#53695c]">{a.address}</p><p className="mt-1 text-xs text-[#718579]">{a.contactName} · {a.contactPhone}</p></div><button aria-label={t('Sửa địa chỉ')} onClick={()=>{setEditingAddressId(a.id);setAddressForm({label:a.label,address:a.address,contactName:a.contactName,contactPhone:a.contactPhone,isDefault:a.isDefault});setShowAddressForm(true);}} className="p-2 text-[#0f7a4f]"><Pencil size={17}/></button><button aria-label={t('Xóa địa chỉ')} onClick={()=>api.deleteAddress(a.id).then(reloadAddresses)} className="p-2 text-rose-600"><Trash2 size={17}/></button></div>{!a.isDefault&&<button onClick={()=>api.setDefaultAddress(a.id).then(reloadAddresses)} className="mt-2 text-xs font-bold text-[#0f7a4f]">{t('Đặt làm mặc định')}</button>}</div>)}
      {showAddressForm&&<form className="grid gap-2 sm:grid-cols-2" onSubmit={async e=>{e.preventDefault();if(addressBusy)return;setAddressBusy(true);setAddressError('');try{if(editingAddressId){await api.updateAddress(editingAddressId,addressForm);}else{await api.addAddress(addressForm);}setEditingAddressId(null);setShowAddressForm(false);await reloadAddresses();}catch(cause){setAddressError(addressFailure(cause,'Không lưu được địa chỉ'));}finally{setAddressBusy(false);}}}>{([['label','Tên địa chỉ',2],['address','Địa chỉ giao hàng',5],['contactName','Người nhận',2],['contactPhone','Số điện thoại',8]] as const).map(([key,label,minLength])=><label key={key} className="text-xs font-semibold text-[#53695c]">{t(label)}<input required minLength={minLength} value={addressForm[key]} onChange={e=>setAddressForm(v=>({...v,[key]:e.target.value}))} className="mt-1 h-11 w-full rounded-lg border border-[#d7e3d9] px-3 text-sm"/></label>)}{!editingAddressId&&<label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={addressForm.isDefault} onChange={e=>setAddressForm(v=>({...v,isDefault:e.target.checked}))}/>{t('Đặt làm mặc định')}</label>}<button disabled={addressBusy} className="min-h-11 rounded-lg bg-[#0f7a4f] font-bold text-white disabled:opacity-60">{t('Lưu địa chỉ')}</button><button type="button" onClick={()=>{setShowAddressForm(false);setEditingAddressId(null);}} className="min-h-11 rounded-lg border border-[#d7e3d9] text-sm font-semibold">{t('Hủy')}</button></form>}
      {addressError&&<p className="text-sm text-rose-700">{addressError}</p>}
    </section>
    <section className="overflow-hidden rounded-2xl border border-[#17231d]/10 bg-white shadow-sm">
      <Link to="/doi-mat-khau" className="flex items-center gap-3 px-4 py-4 text-sm font-semibold text-[#263e31]"><KeyRound size={18} className="text-[#0f7a4f]"/>{t('Đổi mật khẩu')}<ChevronRight size={17} className="ml-auto text-[#829087]"/></Link>
    </section>
    <p className="flex items-center gap-2 px-1 text-xs text-[#718579]"><ShieldCheck size={16} className="text-[#0f7a4f]"/>{t('Thông tin tài khoản được bảo mật')}</p>
  </div>;
}

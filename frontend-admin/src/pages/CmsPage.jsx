import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { cmsApi } from '../services/phase5.api';
import HomeCmsEditor from '../components/cms/HomeCmsEditor';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import StatusBadge from '../components/common/StatusBadge';
import { usePermission } from '../hooks/usePermission';

const PAGE_TABS = [
  { key: 'home', label: 'Homepage' },
  { key: 'about', label: 'About' },
  { key: 'services', label: 'Services' },
  { key: 'faq', label: 'FAQ' },
  { key: 'contact', label: 'Contact' },
  { key: 'notices', label: 'Notices & offers' },
  { key: 'settings', label: 'Contact & logo' },
];

export default function CmsPage() {
  const { can } = usePermission();
  const [tab, setTab] = useState('home');
  const [page, setPage] = useState(null);
  const [notices, setNotices] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [noticeModal, setNoticeModal] = useState(false);
  const [editingNotice, setEditingNotice] = useState(null);

  const pageForm = useForm();
  const noticeForm = useForm({ defaultValues: { type: 'notice', isPublished: true } });
  const settingsForm = useForm();

  const loadPage = useCallback(async (pageKey) => {
    setLoading(true);
    try {
      const { data } = await cmsApi.getPage(pageKey);
      setPage(data.data);
      pageForm.reset({
        title: data.data.title,
        slug: data.data.slug,
        isPublished: data.data.isPublished,
        contentJson: JSON.stringify(data.data.content || {}, null, 2),
        sectionsJson: JSON.stringify(data.data.sections || [], null, 2),
        metaTitle: data.data.seo?.metaTitle || '',
        metaDescription: data.data.seo?.metaDescription || '',
      });
    } finally {
      setLoading(false);
    }
  }, [pageForm]);

  const loadNotices = useCallback(async () => {
    const { data } = await cmsApi.listNotices({ limit: 50 });
    setNotices(data.data);
  }, []);

  const loadSettings = useCallback(async () => {
    const { data } = await cmsApi.getSettings();
    setSettings(data.data);
    settingsForm.reset({
      ...data.data.company,
      logoPath: data.data.logo?.filePath || '',
      logoFileName: data.data.logo?.fileName || '',
      logoAlt: data.data.logo?.altText || '',
      facebook: data.data.socialLinks?.facebook || '',
      instagram: data.data.socialLinks?.instagram || '',
      bankName: data.data.paymentDetails?.bankName || '',
      bankAccountName: data.data.paymentDetails?.bankAccountName || '',
      bankAccountNumber: data.data.paymentDetails?.bankAccountNumber || '',
      bankBranch: data.data.paymentDetails?.bankBranch || '',
      bkashNumber: data.data.paymentDetails?.bkashNumber || '',
      nagadNumber: data.data.paymentDetails?.nagadNumber || '',
      paymentNote: data.data.paymentDetails?.paymentNote || '',
    });
  }, [settingsForm]);

  useEffect(() => {
    setMsg('');
    if (tab === 'home') loadPage('home');
    if (['about', 'services', 'faq', 'contact'].includes(tab)) loadPage(tab);
    if (tab === 'notices') loadNotices();
    if (tab === 'settings') loadSettings();
  }, [tab, loadPage, loadNotices, loadSettings]);

  const savePage = async (values) => {
    if (!can('cms:manage')) return;
    setMsg('');
    try {
      let content = {};
      let sections = [];
      try { content = JSON.parse(values.contentJson || '{}'); } catch { setMsg('Invalid content JSON'); return; }
      try { sections = JSON.parse(values.sectionsJson || '[]'); } catch { setMsg('Invalid sections JSON'); return; }

      await cmsApi.updatePage(tab, {
        title: values.title,
        slug: values.slug,
        isPublished: values.isPublished,
        content,
        sections,
        seo: { metaTitle: values.metaTitle, metaDescription: values.metaDescription },
      });
      setMsg('Page saved');
      loadPage(tab);
    } catch (err) {
      setMsg(err.response?.data?.message || 'Save failed');
    }
  };

  const saveNotice = async (values) => {
    setMsg('');
    try {
      if (editingNotice) {
        await cmsApi.updateNotice(editingNotice.id, values);
      } else {
        await cmsApi.createNotice(values);
      }
      setNoticeModal(false);
      setEditingNotice(null);
      noticeForm.reset({ type: 'notice', isPublished: true });
      loadNotices();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Notice save failed');
    }
  };

  const saveSettings = async (values) => {
    setMsg('');
    try {
      await cmsApi.updateSettings({
        company: {
          name: values.name,
          address: values.address,
          email: values.email,
          whatsapp: values.whatsapp,
          directorName: values.directorName,
          directorPhone: values.directorPhone,
          ownerEmail: values.ownerEmail,
        },
        socialLinks: { facebook: values.facebook, instagram: values.instagram },
        paymentDetails: {
          bankName: values.bankName,
          bankAccountName: values.bankAccountName,
          bankAccountNumber: values.bankAccountNumber,
          bankBranch: values.bankBranch,
          bkashNumber: values.bkashNumber,
          nagadNumber: values.nagadNumber,
          paymentNote: values.paymentNote,
        },
      });
      if (values.logoPath) {
        await cmsApi.updateLogo({
          filePath: values.logoPath,
          fileName: values.logoFileName,
          altText: values.logoAlt,
        });
      }
      setMsg('Settings saved');
      loadSettings();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Settings save failed');
    }
  };

  const noticeColumns = [
    { key: 'title', label: 'Title' },
    { key: 'type', label: 'Type', render: (r) => <StatusBadge status={r.type} label={r.type} /> },
    { key: 'isPublished', label: 'Published', render: (r) => (r.isPublished ? 'Yes' : 'No') },
    {
      key: 'actions',
      label: '',
      render: (r) =>
        can('cms:manage') ? (
          <button
            type="button"
            className="text-xs text-brand-600 hover:underline"
            onClick={() => {
              setEditingNotice(r);
              noticeForm.reset(r);
              setNoticeModal(true);
            }}
          >
            Edit
          </button>
        ) : null,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        {PAGE_TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`rounded-lg px-3 py-2 text-sm ${tab === t.key ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {msg && <p className="text-sm text-brand-700">{msg}</p>}

      {tab === 'home' && (
        <HomeCmsEditor
          page={page}
          canManage={can('cms:manage')}
          onSaved={() => loadPage('home')}
          onMessage={setMsg}
        />
      )}

      {['about', 'services', 'faq', 'contact'].includes(tab) && (
        <form onSubmit={pageForm.handleSubmit(savePage)} className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
          {loading ? <p className="text-sm text-slate-500">Loading…</p> : (
            <>
              <div className="grid gap-3 md:grid-cols-2">
                <div><label className="mb-1 block text-sm font-medium">Title</label><input className="input-field" {...pageForm.register('title')} disabled={!can('cms:manage')} /></div>
                <div><label className="mb-1 block text-sm font-medium">Slug</label><input className="input-field" {...pageForm.register('slug')} disabled={!can('cms:manage')} /></div>
                <div><label className="mb-1 block text-sm font-medium">SEO meta title</label><input className="input-field" {...pageForm.register('metaTitle')} disabled={!can('cms:manage')} /></div>
                <div><label className="mb-1 block text-sm font-medium">SEO meta description</label><input className="input-field" {...pageForm.register('metaDescription')} disabled={!can('cms:manage')} /></div>
              </div>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" {...pageForm.register('isPublished')} disabled={!can('cms:manage')} /> Published</label>
              <div><label className="mb-1 block text-sm font-medium">Content (JSON)</label><textarea className="input-field font-mono text-xs" rows={6} {...pageForm.register('contentJson')} disabled={!can('cms:manage')} /></div>
              <div><label className="mb-1 block text-sm font-medium">Sections (JSON array — homepage hero, services blocks, etc.)</label><textarea className="input-field font-mono text-xs" rows={6} {...pageForm.register('sectionsJson')} disabled={!can('cms:manage')} /></div>
              {can('cms:manage') && <button type="submit" className="btn-primary">Save page</button>}
            </>
          )}
        </form>
      )}

      {tab === 'notices' && (
        <div className="space-y-3">
          {can('cms:manage') && (
            <button type="button" className="btn-primary" onClick={() => { setEditingNotice(null); noticeForm.reset({ type: 'notice', isPublished: true }); setNoticeModal(true); }}>
              Add notice / offer / FAQ item
            </button>
          )}
          <DataTable columns={noticeColumns} rows={notices} emptyMessage="No notices" />
        </div>
      )}

      {tab === 'settings' && settings && (
        <form onSubmit={settingsForm.handleSubmit(saveSettings)} className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div><label className="mb-1 block text-sm font-medium">Company name</label><input className="input-field" {...settingsForm.register('name')} disabled={!can('cms:manage')} /></div>
            <div><label className="mb-1 block text-sm font-medium">Email</label><input className="input-field" {...settingsForm.register('email')} disabled={!can('cms:manage')} /></div>
            <div><label className="mb-1 block text-sm font-medium">WhatsApp</label><input className="input-field" {...settingsForm.register('whatsapp')} disabled={!can('cms:manage')} /></div>
            <div><label className="mb-1 block text-sm font-medium">Director</label><input className="input-field" {...settingsForm.register('directorName')} disabled={!can('cms:manage')} /></div>
            <div className="md:col-span-2"><label className="mb-1 block text-sm font-medium">Address</label><textarea className="input-field" rows={2} {...settingsForm.register('address')} disabled={!can('cms:manage')} /></div>
            <div><label className="mb-1 block text-sm font-medium">Logo path</label><input className="input-field" placeholder="/uploads/logo.png" {...settingsForm.register('logoPath')} disabled={!can('cms:manage')} /></div>
            <div><label className="mb-1 block text-sm font-medium">Logo filename</label><input className="input-field" {...settingsForm.register('logoFileName')} disabled={!can('cms:manage')} /></div>
          </div>
          <div className="border-t border-slate-200 pt-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-900">Payment details (shown on homepage footer)</h3>
            <p className="mb-3 text-xs text-slate-500">For full ledger accounts, use Settings → Payment Accounts. SMS, email, and templates are under Notification settings in the sidebar.</p>
            <div className="grid gap-3 md:grid-cols-2">
              <div><label className="mb-1 block text-sm font-medium">Bank name</label><input className="input-field" {...settingsForm.register('bankName')} disabled={!can('cms:manage')} /></div>
              <div><label className="mb-1 block text-sm font-medium">Account holder</label><input className="input-field" {...settingsForm.register('bankAccountName')} disabled={!can('cms:manage')} /></div>
              <div><label className="mb-1 block text-sm font-medium">Account number</label><input className="input-field" {...settingsForm.register('bankAccountNumber')} disabled={!can('cms:manage')} /></div>
              <div><label className="mb-1 block text-sm font-medium">Branch</label><input className="input-field" {...settingsForm.register('bankBranch')} disabled={!can('cms:manage')} /></div>
              <div><label className="mb-1 block text-sm font-medium">bKash number</label><input className="input-field" {...settingsForm.register('bkashNumber')} disabled={!can('cms:manage')} /></div>
              <div><label className="mb-1 block text-sm font-medium">Nagad number</label><input className="input-field" {...settingsForm.register('nagadNumber')} disabled={!can('cms:manage')} /></div>
              <div className="md:col-span-2"><label className="mb-1 block text-sm font-medium">Payment note</label><textarea className="input-field" rows={2} {...settingsForm.register('paymentNote')} disabled={!can('cms:manage')} /></div>
            </div>
          </div>
          {can('cms:manage') && <button type="submit" className="btn-primary">Save contact & payments</button>}
        </form>
      )}

      <Modal
        open={noticeModal}
        onClose={() => setNoticeModal(false)}
        title={editingNotice ? 'Edit notice' : 'New notice'}
        footer={(
          <button type="submit" form="notice-form" className="btn-primary w-full sm:w-auto">Save</button>
        )}
      >
        <form id="notice-form" onSubmit={noticeForm.handleSubmit(saveNotice)} className="space-y-3">
          <input className="input-field" placeholder="Title" {...noticeForm.register('title', { required: true })} />
          <textarea className="input-field" rows={4} placeholder="Content" {...noticeForm.register('content', { required: true })} />
          <select className="input-field" {...noticeForm.register('type')}>
            <option value="notice">Notice</option>
            <option value="offer">Offer</option>
            <option value="faq">FAQ</option>
            <option value="announcement">Announcement</option>
          </select>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" {...noticeForm.register('isPublished')} /> Published</label>
        </form>
      </Modal>
    </div>
  );
}

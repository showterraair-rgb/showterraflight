import { useEffect, useState } from 'react';
import { cmsApi } from '../../services/phase5.api';

const SECTION_TABS = [
  { key: 'hero', label: 'Hero slider', list: 'slides' },
  { key: 'promo', label: 'Promo slider', list: 'slides' },
  { key: 'services', label: 'Services', list: 'items' },
  { key: 'packages', label: 'Packages', list: 'items' },
  { key: 'worldMap', label: 'Bangladesh-to-World' },
  { key: 'about', label: 'About' },
  { key: 'testimonials', label: 'Testimonials', list: 'items' },
  { key: 'gallery', label: 'Gallery', list: 'items' },
  { key: 'team', label: 'Team', list: 'items' },
  { key: 'trust', label: 'Trust / Payments' },
  { key: 'paymentStrip', label: 'Payment strip', list: 'methods' },
  { key: 'cta', label: 'CTA' },
  { key: 'contact', label: 'Contact' },
  { key: 'footer', label: 'Footer', list: 'exploreLinks' },
];

function nextId(items = []) {
  const max = items.reduce((m, i) => Math.max(m, Number(i.id) || 0), 0);
  return max + 1;
}

function moveItem(items, index, dir) {
  const next = [...items];
  const target = index + dir;
  if (target < 0 || target >= next.length) return items;
  [next[index], next[target]] = [next[target], next[index]];
  return next.map((item, i) => ({ ...item, sortOrder: i }));
}

async function uploadImage(file) {
  const { data } = await cmsApi.upload(file);
  return data.data.url || `/uploads/${data.data.filePath}`;
}

function SelectField({ label, value, onChange, options }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-slate-600">{label}</span>
      <select className="input-field w-full" value={value || ''} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}

function Field({ label, value, onChange, multiline, type = 'text' }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-slate-600">{label}</span>
      {multiline ? (
        <textarea className="input-field w-full" rows={3} value={value || ''} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input type={type} className="input-field w-full" value={value || ''} onChange={(e) => onChange(e.target.value)} />
      )}
    </label>
  );
}

function TrustPointsField({ value = [], onChange }) {
  const points = Array.isArray(value) ? value : [];
  return (
    <div className="space-y-2 md:col-span-2">
      <span className="block text-sm font-medium text-slate-600">Trust points (one per line)</span>
      <textarea
        className="input-field w-full"
        rows={3}
        value={points.join('\n')}
        onChange={(e) => onChange(e.target.value.split('\n').map((s) => s.trim()).filter(Boolean))}
      />
    </div>
  );
}

function ImageField({ label, value, onChange }) {
  return (
    <div className="space-y-2">
      <Field label={label} value={value} onChange={onChange} />
      <input
        type="file"
        accept="image/*"
        className="text-xs"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          try {
            const url = await uploadImage(file);
            onChange(url);
          } catch {
            alert('Upload failed');
          }
        }}
      />
      {value && <img src={value.startsWith('/') ? value : value} alt="" className="h-20 w-32 rounded border object-cover" />}
    </div>
  );
}

function newListItem(sectionKey, listKey, listItems) {
  const base = { id: nextId(listItems), visible: true, sortOrder: listItems.length };
  if (sectionKey === 'hero') {
    return {
      ...base,
      eyebrow: '',
      title: 'New slide',
      subtitle: '',
      primaryCtaText: 'Book Now',
      primaryCtaLink: '/booking',
      secondaryCtaText: '',
      secondaryCtaLink: '',
      image: '/images/home/hero.svg',
      mobileImage: '',
      overlayOpacity: 0.88,
      textAlign: 'left',
      badge: '',
      trustPoints: [],
    };
  }
  if (sectionKey === 'footer' && listKey === 'exploreLinks') {
    return { ...base, label: 'New link', href: '/#contact' };
  }
  if (sectionKey === 'paymentStrip') {
    return { ...base, label: 'Method', abbr: 'XX', accent: '' };
  }
  return { ...base, title: 'New item', image: '/images/home/destination.svg' };
}

export default function HomeCmsEditor({ page, canManage, onSaved, onMessage }) {
  const [sectionKey, setSectionKey] = useState('hero');
  const [content, setContent] = useState({ sections: {} });
  const [meta, setMeta] = useState({ title: '', slug: '', isPublished: true, metaTitle: '', metaDescription: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!page) return;
    setContent(page.content || { sections: {} });
    setMeta({
      title: page.title || 'Home',
      slug: page.slug || 'home',
      isPublished: page.isPublished !== false,
      metaTitle: page.seo?.metaTitle || '',
      metaDescription: page.seo?.metaDescription || '',
    });
  }, [page]);

  const tab = SECTION_TABS.find((t) => t.key === sectionKey) || SECTION_TABS[0];
  const section = content.sections?.[sectionKey] || { visible: true };

  const patchSection = (patch) => {
    setContent((prev) => ({
      ...prev,
      sections: {
        ...(prev.sections || {}),
        [sectionKey]: { ...section, ...patch },
      },
    }));
  };

  const patchList = (listKey, items) => patchSection({ [listKey]: items });

  const save = async () => {
    if (!canManage) return;
    setSaving(true);
    onMessage?.('');
    try {
      await cmsApi.updatePage('home', {
        title: meta.title,
        slug: meta.slug,
        isPublished: meta.isPublished,
        content,
        seo: { metaTitle: meta.metaTitle, metaDescription: meta.metaDescription },
      });
      onMessage?.('Homepage saved');
      onSaved?.();
    } catch (err) {
      onMessage?.(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const listKey = tab.list;
  const listItems = listKey ? section[listKey] || [] : [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {SECTION_TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setSectionKey(t.key)}
            className={`rounded-lg px-2.5 py-1.5 text-xs sm:text-sm ${sectionKey === t.key ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-700'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-semibold text-slate-900">{tab.label}</h3>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={section.visible !== false} onChange={(e) => patchSection({ visible: e.target.checked })} disabled={!canManage} />
            Show on homepage
          </label>
        </div>

        {sectionKey === 'hero' && (
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Autoplay (ms)" type="number" value={section.autoplayMs} onChange={(v) => patchSection({ autoplayMs: Number(v) || 6000 })} />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={section.showQuickQuote !== false} onChange={(e) => patchSection({ showQuickQuote: e.target.checked })} />
              Show quick quote form
            </label>
            <Field label="Quick quote title" value={section.quickQuoteTitle} onChange={(v) => patchSection({ quickQuoteTitle: v })} />
            <Field label="Quick quote subtitle" value={section.quickQuoteSubtitle} onChange={(v) => patchSection({ quickQuoteSubtitle: v })} multiline />
          </div>
        )}

        {['promo', 'services', 'packages', 'about', 'testimonials', 'gallery', 'team', 'worldMap', 'trust', 'paymentStrip', 'cta', 'contact'].includes(sectionKey) && (
          <div className="grid gap-3 md:grid-cols-2">
            {sectionKey !== 'paymentStrip' && (
              <>
                <Field label="Eyebrow" value={section.eyebrow} onChange={(v) => patchSection({ eyebrow: v })} />
                <Field label="Title" value={section.title} onChange={(v) => patchSection({ title: v })} />
                <Field label="Subtitle / lead" value={section.subtitle || section.lead} onChange={(v) => patchSection(sectionKey === 'about' ? { lead: v } : { subtitle: v })} multiline />
              </>
            )}
            {sectionKey === 'paymentStrip' && (
              <>
                <Field label="Label" value={section.label} onChange={(v) => patchSection({ label: v })} />
                <Field label="Support subline" value={section.supportSubline} onChange={(v) => patchSection({ supportSubline: v })} />
              </>
            )}
            {sectionKey === 'about' && (
              <>
                <Field label="Body" value={section.body} onChange={(v) => patchSection({ body: v })} multiline />
                <ImageField label="Image" value={section.image} onChange={(v) => patchSection({ image: v })} />
              </>
            )}
            {sectionKey === 'cta' && (
              <>
                <ImageField label="Background image" value={section.image} onChange={(v) => patchSection({ image: v })} />
                <Field label="Primary button text" value={section.primaryCtaText} onChange={(v) => patchSection({ primaryCtaText: v })} />
                <Field label="Primary button link" value={section.primaryCtaLink} onChange={(v) => patchSection({ primaryCtaLink: v })} />
                <Field label="Secondary button text" value={section.secondaryCtaText} onChange={(v) => patchSection({ secondaryCtaText: v })} />
                <Field label="Secondary button link" value={section.secondaryCtaLink} onChange={(v) => patchSection({ secondaryCtaLink: v })} />
                <Field label="Tertiary button text" value={section.tertiaryCtaText} onChange={(v) => patchSection({ tertiaryCtaText: v })} />
                <Field label="Tertiary button link" value={section.tertiaryCtaLink} onChange={(v) => patchSection({ tertiaryCtaLink: v })} />
              </>
            )}
            {sectionKey === 'contact' && (
              <>
                <Field label="Office card title" value={section.officeTitle} onChange={(v) => patchSection({ officeTitle: v })} />
                <Field label="Office heading" value={section.officeHeading} onChange={(v) => patchSection({ officeHeading: v })} />
                <Field label="Direct line title" value={section.directLineTitle} onChange={(v) => patchSection({ directLineTitle: v })} />
                <Field label="Direct line heading" value={section.directLineHeading} onChange={(v) => patchSection({ directLineHeading: v })} />
                <Field label="Next step title" value={section.nextStepTitle} onChange={(v) => patchSection({ nextStepTitle: v })} />
                <Field label="Next step heading" value={section.nextStepHeading} onChange={(v) => patchSection({ nextStepHeading: v })} />
                <Field label="Next step body" value={section.nextStepBody} onChange={(v) => patchSection({ nextStepBody: v })} multiline />
                <Field label="WhatsApp button text" value={section.whatsappButtonText} onChange={(v) => patchSection({ whatsappButtonText: v })} />
              </>
            )}
          </div>
        )}

        {sectionKey === 'footer' && (
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Tagline" value={section.tagline} onChange={(v) => patchSection({ tagline: v })} multiline />
            <Field label="Support note" value={section.supportNote} onChange={(v) => patchSection({ supportNote: v })} multiline />
            <Field label="CTA text" value={section.ctaText} onChange={(v) => patchSection({ ctaText: v })} />
            <Field label="CTA link" value={section.ctaLink} onChange={(v) => patchSection({ ctaLink: v })} />
            <Field label="Explore column title" value={section.exploreTitle} onChange={(v) => patchSection({ exploreTitle: v })} />
            <Field label="Services column title" value={section.servicesTitle} onChange={(v) => patchSection({ servicesTitle: v })} />
            <Field label="Contact column title" value={section.contactTitle} onChange={(v) => patchSection({ contactTitle: v })} />
            <Field label="Copyright text" value={section.copyrightText} onChange={(v) => patchSection({ copyrightText: v })} />
            <Field label="Legal text" value={section.legalText} onChange={(v) => patchSection({ legalText: v })} multiline />
            <Field label="Location line" value={section.locationLine} onChange={(v) => patchSection({ locationLine: v })} />
            <label className="flex items-center gap-2 text-sm md:col-span-2">
              <input type="checkbox" checked={section.showPaymentStrip !== false} onChange={(e) => patchSection({ showPaymentStrip: e.target.checked })} />
              Show payment strip in footer
            </label>
          </div>
        )}

        {listKey && (
          <div className="space-y-3 border-t border-slate-100 pt-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-700">Items ({listItems.length})</p>
              {canManage && (
                <button
                  type="button"
                  className="btn-secondary text-xs"
                  onClick={() => patchList(listKey, [...listItems, newListItem(sectionKey, listKey, listItems)])}
                >
                  Add item
                </button>
              )}
            </div>
            {listItems.map((item, index) => (
              <div key={item.id ?? index} className="rounded-lg border border-slate-200 p-3 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <label className="flex items-center gap-1 text-xs">
                    <input type="checkbox" checked={item.visible !== false} onChange={(e) => {
                      const items = [...listItems];
                      items[index] = { ...item, visible: e.target.checked };
                      patchList(listKey, items);
                    }} />
                    Visible
                  </label>
                  <button type="button" className="text-xs text-slate-500" onClick={() => patchList(listKey, moveItem(listItems, index, -1))}>↑</button>
                  <button type="button" className="text-xs text-slate-500" onClick={() => patchList(listKey, moveItem(listItems, index, 1))}>↓</button>
                  <button type="button" className="ml-auto text-xs text-red-600" onClick={() => patchList(listKey, listItems.filter((_, i) => i !== index))}>Delete</button>
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  {sectionKey === 'hero' && (
                    <>
                      <Field label="Eyebrow" value={item.eyebrow} onChange={(v) => {
                        const items = [...listItems];
                        items[index] = { ...item, eyebrow: v };
                        patchList(listKey, items);
                      }} />
                      <Field label="Title" value={item.title} onChange={(v) => {
                        const items = [...listItems];
                        items[index] = { ...item, title: v };
                        patchList(listKey, items);
                      }} />
                      <Field label="Subtitle" value={item.subtitle} onChange={(v) => {
                        const items = [...listItems];
                        items[index] = { ...item, subtitle: v };
                        patchList(listKey, items);
                      }} multiline />
                      <Field label="Badge" value={item.badge} onChange={(v) => {
                        const items = [...listItems];
                        items[index] = { ...item, badge: v };
                        patchList(listKey, items);
                      }} />
                      <Field label="Primary CTA text" value={item.primaryCtaText} onChange={(v) => {
                        const items = [...listItems];
                        items[index] = { ...item, primaryCtaText: v };
                        patchList(listKey, items);
                      }} />
                      <Field label="Primary CTA link" value={item.primaryCtaLink} onChange={(v) => {
                        const items = [...listItems];
                        items[index] = { ...item, primaryCtaLink: v };
                        patchList(listKey, items);
                      }} />
                      <Field label="Secondary CTA text" value={item.secondaryCtaText} onChange={(v) => {
                        const items = [...listItems];
                        items[index] = { ...item, secondaryCtaText: v };
                        patchList(listKey, items);
                      }} />
                      <Field label="Secondary CTA link" value={item.secondaryCtaLink} onChange={(v) => {
                        const items = [...listItems];
                        items[index] = { ...item, secondaryCtaLink: v };
                        patchList(listKey, items);
                      }} />
                      <ImageField label="Background image" value={item.image} onChange={(v) => {
                        const items = [...listItems];
                        items[index] = { ...item, image: v };
                        patchList(listKey, items);
                      }} />
                      <ImageField label="Mobile image (optional)" value={item.mobileImage} onChange={(v) => {
                        const items = [...listItems];
                        items[index] = { ...item, mobileImage: v };
                        patchList(listKey, items);
                      }} />
                      <Field label="Overlay opacity (0–1)" type="number" value={item.overlayOpacity} onChange={(v) => {
                        const items = [...listItems];
                        items[index] = { ...item, overlayOpacity: Number(v) };
                        patchList(listKey, items);
                      }} />
                      <SelectField label="Text alignment" value={item.textAlign || 'left'} onChange={(v) => {
                        const items = [...listItems];
                        items[index] = { ...item, textAlign: v };
                        patchList(listKey, items);
                      }} options={[
                        { value: 'left', label: 'Left' },
                        { value: 'center', label: 'Center' },
                      ]} />
                      <TrustPointsField value={item.trustPoints} onChange={(v) => {
                        const items = [...listItems];
                        items[index] = { ...item, trustPoints: v };
                        patchList(listKey, items);
                      }} />
                    </>
                  )}
                  {sectionKey === 'footer' && listKey === 'exploreLinks' && (
                    <>
                      <Field label="Label" value={item.label} onChange={(v) => {
                        const items = [...listItems];
                        items[index] = { ...item, label: v };
                        patchList(listKey, items);
                      }} />
                      <Field label="Link (href)" value={item.href} onChange={(v) => {
                        const items = [...listItems];
                        items[index] = { ...item, href: v };
                        patchList(listKey, items);
                      }} />
                    </>
                  )}
                  {sectionKey === 'paymentStrip' && listKey === 'methods' && (
                    <>
                      <Field label="Label" value={item.label} onChange={(v) => {
                        const items = [...listItems];
                        items[index] = { ...item, label: v };
                        patchList(listKey, items);
                      }} />
                      <Field label="Abbreviation" value={item.abbr} onChange={(v) => {
                        const items = [...listItems];
                        items[index] = { ...item, abbr: v };
                        patchList(listKey, items);
                      }} />
                      <Field label="Accent class (optional)" value={item.accent} onChange={(v) => {
                        const items = [...listItems];
                        items[index] = { ...item, accent: v };
                        patchList(listKey, items);
                      }} />
                    </>
                  )}
                  {sectionKey !== 'hero' && !(sectionKey === 'footer' && listKey === 'exploreLinks') && !(sectionKey === 'paymentStrip' && listKey === 'methods') && (
                    <>
                  <Field label="Title / name" value={item.title || item.name || item.destination} onChange={(v) => {
                    const items = [...listItems];
                    items[index] = { ...item, title: v, name: v, destination: v };
                    patchList(listKey, items);
                  }} />
                  {(item.subtitle !== undefined || sectionKey === 'promo' || sectionKey === 'gallery') && (
                    <Field label="Subtitle / description" value={item.subtitle || item.description || item.text} onChange={(v) => {
                      const items = [...listItems];
                      items[index] = { ...item, subtitle: v, description: v, text: v };
                      patchList(listKey, items);
                    }} multiline />
                  )}
                  {(item.image !== undefined || item.avatar !== undefined || sectionKey !== 'services') && (
                    <ImageField
                      label="Image"
                      value={item.image || item.avatar}
                      onChange={(v) => {
                        const items = [...listItems];
                        items[index] = { ...item, image: v, avatar: v };
                        patchList(listKey, items);
                      }}
                    />
                  )}
                  {sectionKey === 'packages' && (
                    <Field label="Price" value={item.price} onChange={(v) => {
                      const items = [...listItems];
                      items[index] = { ...item, price: v };
                      patchList(listKey, items);
                    }} />
                  )}
                    </>
                  )}
                </div>
              </div>
            ))}
            {!listItems.length && (
              <p className="text-xs text-slate-500">No CMS items yet — defaults from site content are used until you add items here.</p>
            )}
          </div>
        )}
      </div>

      <details className="rounded-xl border border-slate-200 bg-white p-4">
        <summary className="cursor-pointer text-sm font-medium text-slate-700">Page meta & SEO</summary>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <Field label="Page title" value={meta.title} onChange={(v) => setMeta((m) => ({ ...m, title: v }))} />
          <Field label="Slug" value={meta.slug} onChange={(v) => setMeta((m) => ({ ...m, slug: v }))} />
          <Field label="SEO title" value={meta.metaTitle} onChange={(v) => setMeta((m) => ({ ...m, metaTitle: v }))} />
          <Field label="SEO description" value={meta.metaDescription} onChange={(v) => setMeta((m) => ({ ...m, metaDescription: v }))} />
          <label className="flex items-center gap-2 text-sm md:col-span-2">
            <input type="checkbox" checked={meta.isPublished} onChange={(e) => setMeta((m) => ({ ...m, isPublished: e.target.checked }))} />
            Published
          </label>
        </div>
      </details>

      {canManage && (
        <button type="button" className="btn-primary" disabled={saving} onClick={save}>
          {saving ? 'Saving…' : 'Save homepage'}
        </button>
      )}
    </div>
  );
}

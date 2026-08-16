import { useState } from 'react';
import { Check } from 'lucide-react';
import { C, fontMono, fontSans } from '../../theme/tokens';

export function Field({ label, children, span = 1 }) {
  return (
    <div style={{ gridColumn: `span ${span}`, display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: C.indigo, letterSpacing: '0.02em', ...fontSans }}>{label}</label>
      {children}
    </div>
  );
}

export function TextInput({
  placeholder, mono, value, onChange, type = 'text', name, disabled, defaultValue, ...rest
}) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type={type}
      name={name}
      placeholder={placeholder}
      value={value}
      defaultValue={defaultValue}
      disabled={disabled}
      onChange={(e) => onChange?.(e.target.value, e)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        padding: '8px 10px', fontSize: 13, borderRadius: 6, width: '100%',
        border: `1px solid ${focused ? C.teal : C.border}`,
        background: C.surface, color: C.text, outline: 'none',
        boxShadow: focused ? `0 0 0 3px ${C.teal}20` : 'none',
        transition: 'border-color 0.12s, box-shadow 0.12s',
        ...(mono ? fontMono : fontSans),
      }}
      {...rest}
    />
  );
}

export function SelectInput({ options, value, onChange, children, ...rest }) {
  const [focused, setFocused] = useState(false);
  const opts = options || [];
  return (
    <select
      value={value}
      onChange={(e) => onChange?.(e.target.value, e)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        padding: '8px 10px', fontSize: 13, borderRadius: 6, width: '100%',
        border: `1px solid ${focused ? C.teal : C.border}`,
        background: C.surface, color: C.text, outline: 'none',
        boxShadow: focused ? `0 0 0 3px ${C.teal}20` : 'none',
        ...fontSans, cursor: 'pointer', appearance: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center',
        paddingRight: 30, transition: 'border-color 0.12s',
      }}
      {...rest}
    >
      {children || opts.map((o) => (
        <option key={typeof o === 'string' ? o : o.value} value={typeof o === 'string' ? o : o.value}>
          {typeof o === 'string' ? o : o.label}
        </option>
      ))}
    </select>
  );
}

export function DateInput({ value, onChange, ...rest }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type="date"
      value={value}
      onChange={(e) => onChange?.(e.target.value, e)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        padding: '8px 10px', fontSize: 13, borderRadius: 6, width: '100%',
        border: `1px solid ${focused ? C.teal : C.border}`,
        background: C.surface, color: C.text, outline: 'none',
        boxShadow: focused ? `0 0 0 3px ${C.teal}20` : 'none',
        ...fontMono, cursor: 'pointer', transition: 'border-color 0.12s',
      }}
      {...rest}
    />
  );
}

export function MiniSelect({ label, options, value, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 10, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', ...fontSans }}>{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          padding: '6px 10px', fontSize: 12, borderRadius: 6,
          border: `1px solid ${C.border}`, background: C.surface, color: C.text,
          outline: 'none', cursor: 'pointer', ...fontSans, appearance: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center', paddingRight: 28,
        }}
      >
        {options.map((o) => (
          <option key={typeof o === 'string' ? o : o.value} value={typeof o === 'string' ? o : o.value}>
            {typeof o === 'string' ? o : o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function MiniDate({ label, value, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 10, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', ...fontSans }}>{label}</label>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          padding: '6px 10px', fontSize: 12, borderRadius: 6,
          border: `1px solid ${C.border}`, background: C.surface, color: C.text,
          outline: 'none', ...fontMono, cursor: 'pointer',
        }}
      />
    </div>
  );
}

export function MiniCheck({ label, checked, onChange }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', userSelect: 'none' }}>
      <div
        onClick={() => onChange(!checked)}
        style={{
          width: 14, height: 14, borderRadius: 3, flexShrink: 0,
          border: `1.5px solid ${checked ? C.teal : C.border}`,
          background: checked ? C.teal : C.surface,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {checked && <Check size={9} color="#fff" strokeWidth={3} />}
      </div>
      <span style={{ fontSize: 11, color: C.text, ...fontSans }}>{label}</span>
    </label>
  );
}

export function FormSection({ title, icon, children }) {
  return (
    <div
      style={{
        background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: 10, overflow: 'hidden', marginBottom: 16,
      }}
    >
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '12px 20px', borderBottom: `1px solid ${C.border}`, background: C.bg,
        }}
      >
        {icon && <span style={{ color: C.teal }}>{icon}</span>}
        <span style={{ fontSize: 12, fontWeight: 600, color: C.indigo, textTransform: 'uppercase', letterSpacing: '0.07em', ...fontSans }}>
          {title}
        </span>
      </div>
      <div style={{ padding: 20 }}>{children}</div>
    </div>
  );
}

export function DocUploadField({ label, fileName, onChange, accept }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 130, flex: '1 1 130px' }}>
      <label style={{ fontSize: 10, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', ...fontSans }}>
        {label}
      </label>
      <label
        style={{
          display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
          padding: '5px 8px', borderRadius: 6, border: `1px solid ${C.border}`,
          background: C.surface, fontSize: 11, color: C.muted, ...fontSans, overflow: 'hidden',
        }}
      >
        <input
          type="file"
          accept={accept}
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onChange?.(file);
          }}
        />
        <span
          style={{
            background: C.indigo, color: '#fff', padding: '2px 8px', borderRadius: 4,
            fontSize: 11, fontWeight: 500, flexShrink: 0, whiteSpace: 'nowrap',
          }}
        >
          Choose File
        </span>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 11 }}>
          {fileName ?? 'No file chosen'}
        </span>
      </label>
    </div>
  );
}

export default function CurrencySelector({ value, onChange, brlRate, className = 'input-field' }) {
  return (
    <div>
      <select className={className} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="BDT">BDT (৳)</option>
        <option value="BRL">BRL (R$)</option>
      </select>
      {value === 'BRL' && brlRate && (
        <p className="mt-1 text-xs text-slate-500">
          Current rate: 1 BRL = ৳ {Number(brlRate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      )}
    </div>
  );
}

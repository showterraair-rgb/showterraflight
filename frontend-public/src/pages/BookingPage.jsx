import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useSearchParams } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import PublicLayout from '../layouts/PublicLayout';
import PageHero from '../components/PageHero';
import DestinationPicker from '../components/common/DestinationPicker';
import { useCompany } from '../context/CompanyContext';
import { useCurrency } from '../hooks/useCurrency';
import { getWhatsAppDigits } from '../utils/companyHelpers';
import { publicApi } from '../services/api';

const JOURNEY_TYPES = ['one_way', 'round_trip', 'multi_city'];
const TRAVEL_CLASSES = ['economy', 'premium_economy', 'business', 'first'];

const bookingSchema = z
  .object({
    customerName: z.string().min(2, 'Name is required'),
    customerPhone: z.string().min(10, 'Valid phone required'),
    customerEmail: z.string().email('Invalid email').optional().or(z.literal('')),
    journeyType: z.enum(JOURNEY_TYPES),
    fromDestination: z.string().min(2, 'From destination required'),
    toDestination: z.string().min(2, 'To destination required'),
    journeyDate: z.string().min(1, 'Journey date required'),
    returnDate: z.string().optional(),
    passengerCount: z.coerce.number().int().min(1).max(20),
    travelClass: z.enum(TRAVEL_CLASSES),
    preferredCurrency: z.enum(['BDT', 'BRL']).default('BDT'),
    requestNotes: z.string().max(2000).optional(),
  })
  .refine((d) => d.journeyType !== 'round_trip' || d.returnDate, {
    message: 'Return date required for round trip',
    path: ['returnDate'],
  });

const JOURNEY_LABELS = { one_way: 'One Way', round_trip: 'Round Trip', multi_city: 'Multi City' };
const CLASS_LABELS = {
  economy: 'Economy',
  premium_economy: 'Premium Economy',
  business: 'Business',
  first: 'First Class',
};

function formatBookingWhatsAppMessage(data) {
  const lines = [
    '*Booking Request — Show Terra Flight*',
    '',
    `*Name:* ${data.customerName}`,
    `*Phone:* ${data.customerPhone}`,
  ];
  if (data.customerEmail) lines.push(`*Email:* ${data.customerEmail}`);
  lines.push(`*Preferred currency:* ${data.preferredCurrency || 'BDT'}`);
  lines.push(
    `*Journey:* ${JOURNEY_LABELS[data.journeyType]}`,
    `*Class:* ${CLASS_LABELS[data.travelClass]}`,
    `*Route:* ${data.fromDestination} → ${data.toDestination}`,
    `*Travel date:* ${data.journeyDate}`,
  );
  if (data.journeyType === 'round_trip' && data.returnDate) {
    lines.push(`*Return date:* ${data.returnDate}`);
  }
  lines.push(`*Passengers:* ${data.passengerCount}`);
  if (data.requestNotes?.trim()) {
    lines.push('', `*Notes:* ${data.requestNotes.trim()}`);
  }
  lines.push('', 'Sent from showterraflight.com/booking');
  return lines.join('\n');
}

export default function BookingPage() {
  const { company } = useCompany();
  const { brlRate } = useCurrency();
  const [searchParams] = useSearchParams();
  const [page, setPage] = useState(null);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      journeyType: 'one_way',
      travelClass: 'economy',
      passengerCount: 1,
      preferredCurrency: 'BDT',
      customerEmail: '',
      requestNotes: '',
      fromDestination: 'DAC',
      toDestination: searchParams.get('destination')?.toUpperCase() || '',
      journeyDate: searchParams.get('date') || '',
      customerPhone: searchParams.get('phone') || '',
    },
  });

  const journeyType = watch('journeyType');
  const preferredCurrency = watch('preferredCurrency');
  const fromDestination = watch('fromDestination');
  const toDestination = watch('toDestination');
  const wa = getWhatsAppDigits(company);

  useEffect(() => {
    publicApi.getCmsPage('booking').then(({ data }) => setPage(data.data)).catch(() => {});
  }, []);

  const onSubmit = (data) => {
    setError('');
    setSent(false);
    if (!wa) {
      setError('WhatsApp number is not configured. Please call our office instead.');
      return;
    }
    const message = formatBookingWhatsAppMessage(data);
    const url = `https://wa.me/88${wa}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    setSent(true);
  };

  return (
    <PublicLayout title="Book a Ticket" description="Submit an air ticket booking request to Show Terra Air via WhatsApp">
      <PageHero
        title={page?.content?.heading || 'Request an Air Ticket'}
        subtitle={page?.content?.note || 'Fill in your travel details and send the request to us on WhatsApp for a fare quote.'}
      />

      <section className="container-page py-12">
        <div className="mx-auto max-w-2xl">
          {sent && (
            <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-6">
              <p className="text-center text-lg font-semibold text-green-800">Opening WhatsApp…</p>
              <p className="mt-2 text-center text-sm text-green-700">
                Your booking details were prepared. Send the message in WhatsApp to{' '}
                <strong>{company?.whatsapp || 'our desk'}</strong> — our team will reply with fare options.
              </p>
              <p className="mt-2 text-center text-xs text-green-700">
                You can attach a passport copy in the same WhatsApp chat if you have one ready.
              </p>
            </div>
          )}

          {error && (
            <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-slate-700">Full Name *</label>
                <input className="input-field" {...register('customerName')} />
                {errors.customerName && <p className="mt-1 text-xs text-red-600">{errors.customerName.message}</p>}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Phone *</label>
                <input className="input-field" placeholder="01XXXXXXXXX" {...register('customerPhone')} />
                {errors.customerPhone && <p className="mt-1 text-xs text-red-600">{errors.customerPhone.message}</p>}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
                <input type="email" className="input-field" {...register('customerEmail')} />
                {errors.customerEmail && <p className="mt-1 text-xs text-red-600">{errors.customerEmail.message}</p>}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Journey Type *</label>
                <select className="input-field" {...register('journeyType')}>
                  {JOURNEY_TYPES.map((t) => (
                    <option key={t} value={t}>{JOURNEY_LABELS[t]}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Travel Class *</label>
                <select className="input-field" {...register('travelClass')}>
                  {TRAVEL_CLASSES.map((c) => (
                    <option key={c} value={c}>{CLASS_LABELS[c]}</option>
                  ))}
                </select>
              </div>

              <DestinationPicker
                mode="airport"
                label="From *"
                placeholder="e.g. DAC"
                value={fromDestination}
                onChange={(v) => setValue('fromDestination', v, { shouldValidate: true })}
                error={errors.fromDestination?.message}
              />

              <DestinationPicker
                mode="airport"
                label="To *"
                placeholder="e.g. DXB"
                value={toDestination}
                onChange={(v) => setValue('toDestination', v, { shouldValidate: true })}
                error={errors.toDestination?.message}
              />

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Journey Date *</label>
                <input type="date" className="input-field" {...register('journeyDate')} />
                {errors.journeyDate && <p className="mt-1 text-xs text-red-600">{errors.journeyDate.message}</p>}
              </div>

              {journeyType === 'round_trip' && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Return Date *</label>
                  <input type="date" className="input-field" {...register('returnDate')} />
                  {errors.returnDate && <p className="mt-1 text-xs text-red-600">{errors.returnDate.message}</p>}
                </div>
              )}

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Preferred Currency</label>
                <select className="input-field" {...register('preferredCurrency')}>
                  <option value="BDT">BDT (Bangladeshi Taka ৳)</option>
                  <option value="BRL">BRL (Brazilian Real R$)</option>
                </select>
                {preferredCurrency === 'BRL' && (
                  <p className="mt-1 text-xs text-slate-500">1 BRL = ৳ {Number(brlRate).toFixed(2)} (current rate)</p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Passengers *</label>
                <input type="number" min={1} max={20} className="input-field" {...register('passengerCount')} />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Additional Notes</label>
              <textarea rows={4} className="input-field" placeholder="Preferred airline, time, special requests..." {...register('requestNotes')} />
            </div>

            <button type="submit" className="btn-whatsapp w-full justify-center">
              Submit Booking Request to WhatsApp
            </button>
          </form>
        </div>
      </section>
    </PublicLayout>
  );
}

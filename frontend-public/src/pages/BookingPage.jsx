import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import PublicLayout from '../layouts/PublicLayout';
import PageHero from '../components/PageHero';
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

export default function BookingPage() {
  const [page, setPage] = useState(null);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      journeyType: 'one_way',
      travelClass: 'economy',
      passengerCount: 1,
      customerEmail: '',
      requestNotes: '',
    },
  });

  const journeyType = watch('journeyType');

  useEffect(() => {
    publicApi.getCmsPage('booking').then(({ data }) => setPage(data.data)).catch(() => {});
  }, []);

  const onSubmit = async (data) => {
    setError('');
    setSuccess(null);
    setSubmitting(true);
    try {
      const payload = { ...data, customerEmail: data.customerEmail || undefined };
      const { data: res } = await publicApi.submitBookingRequest(payload);
      setSuccess(res.data);
      reset();
    } catch (err) {
      const msg = err.response?.data?.message || 'Submission failed. Please try again.';
      const fieldErrors = err.response?.data?.errors;
      setError(fieldErrors?.length ? fieldErrors.map((e) => e.message).join(', ') : msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PublicLayout title="Book a Ticket" description="Submit an air ticket booking request to Show Terra Air">
      <PageHero
        title={page?.content?.heading || 'Request an Air Ticket'}
        subtitle={page?.content?.note || 'Fill in your travel details and we will contact you with the best fare.'}
      />

      <section className="container-page py-12">
        <div className="mx-auto max-w-2xl">
          {success && (
            <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-6 text-center">
              <p className="text-lg font-semibold text-green-800">Request Submitted!</p>
              <p className="mt-2 text-sm text-green-700">{success.message}</p>
              <p className="mt-1 text-sm font-medium text-green-800">Reference: {success.orderNumber}</p>
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

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">From *</label>
                <input className="input-field" placeholder="e.g. DAC" {...register('fromDestination')} />
                {errors.fromDestination && <p className="mt-1 text-xs text-red-600">{errors.fromDestination.message}</p>}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">To *</label>
                <input className="input-field" placeholder="e.g. DXB" {...register('toDestination')} />
                {errors.toDestination && <p className="mt-1 text-xs text-red-600">{errors.toDestination.message}</p>}
              </div>

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
                <label className="mb-1 block text-sm font-medium text-slate-700">Passengers *</label>
                <input type="number" min={1} max={20} className="input-field" {...register('passengerCount')} />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Additional Notes</label>
              <textarea rows={4} className="input-field" placeholder="Preferred airline, time, special requests..." {...register('requestNotes')} />
            </div>

            <button type="submit" disabled={submitting} className="btn-primary w-full disabled:opacity-60">
              {submitting ? 'Submitting...' : 'Submit Booking Request'}
            </button>
          </form>
        </div>
      </section>
    </PublicLayout>
  );
}

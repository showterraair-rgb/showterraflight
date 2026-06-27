import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { bookingsApi, customersApi, suppliersApi } from '../services/crm.api';
import { accountsApi } from '../services/finance.api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import DualCurrencyAmount from '../components/common/DualCurrencyAmount';
import { useCurrency } from '../hooks/useCurrency';
import { useFieldPermission } from '../hooks/useFieldPermission';
import { BOOKING_STATUSES, BOOKING_STATUS_LABELS, PRODUCT_CATEGORY_LABELS } from '../utils/constants';
import { ACCOUNT_TYPE_LABELS } from '../utils/finance';

const baseSchema = z.object({
  customerId: z.string().min(1, 'Customer required'),
  supplierId: z.string().optional(),
  airline: z.string().min(2),
  route: z.string().min(2, 'Route is required'),
  sector: z.string().optional(),
  departureDate: z.string().min(1),
  passengerCount: z.coerce.number().min(1),
  pnr: z.string().optional(),
  ticketNumber: z.string().optional(),
  purchasePriceBRL: z.coerce.number().min(0),
  salePriceBRL: z.coerce.number().min(0),
  directCostsBRL: z.coerce.number().min(0),
  bdtRate: z.coerce.number().positive('BDT rate must be greater than 0'),
  notes: z.string().optional(),
  status: z.enum(['draft', 'confirmed', 'ticket_issued', 'delivered', 'completed', 'cancelled']),
});

const createSchema = baseSchema.extend({
  customerPaymentStatus: z.enum(['due', 'paid']).default('due'),
  customerPaidAmountBRL: z.coerce.number().min(0).default(0),
  customerPaymentAccountId: z.string().optional(),
  supplierPaymentStatus: z.enum(['due', 'paid']).default('due'),
  supplierPaidAmountBRL: z.coerce.number().min(0).default(0),
  supplierPaymentAccountId: z.string().optional(),
}).superRefine((data, ctx) => {
  const purchaseTotal = data.purchasePriceBRL + data.directCostsBRL;
  if (data.customerPaidAmountBRL > data.salePriceBRL + 0.001) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Cannot exceed sale price', path: ['customerPaidAmountBRL'] });
  }
  if (data.customerPaidAmountBRL > 0 && !data.customerPaymentAccountId) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Select a payment account', path: ['customerPaymentAccountId'] });
  }
  if (data.supplierPaidAmountBRL > purchaseTotal + 0.001) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Cannot exceed purchase + costs', path: ['supplierPaidAmountBRL'] });
  }
  if (data.supplierPaidAmountBRL > 0 && !data.supplierId) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Select a supplier first', path: ['supplierId'] });
  }
  if (data.supplierPaidAmountBRL > 0 && !data.supplierPaymentAccountId) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Select a payment account', path: ['supplierPaymentAccountId'] });
  }
});

function parseRoute(route) {
  const trimmed = String(route || '').trim();
  const match = trimmed.match(/^(.+?)\s*(?:→|->|—|-)\s*(.+)$/);
  if (match) {
    return { fromDestination: match[1].trim(), toDestination: match[2].trim() };
  }
  return { fromDestination: trimmed, toDestination: trimmed };
}

function fmt(n) {
  return Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function brlFromStored(booking, field, rate) {
  const p = booking.pricing;
  if (p) {
    if (field === 'purchase') return p.purchasePriceBRL ?? 0;
    if (field === 'sale') return p.salePriceBRL ?? 0;
    return p.directCostsBRL ?? 0;
  }
  if (booking.originalCurrency === 'BRL') {
    if (field === 'purchase') return booking.originalPurchasePrice ?? booking.purchasePrice ?? 0;
    if (field === 'sale') return booking.originalSalePrice ?? booking.salePrice ?? 0;
    return booking.originalDirectCosts ?? booking.directCosts ?? 0;
  }
  const bdt = field === 'purchase' ? booking.purchasePrice : field === 'sale' ? booking.salePrice : booking.directCosts;
  return rate > 0 ? Number(bdt || 0) / rate : Number(bdt || 0);
}

const CATEGORY_PATHS = { air: '/bookings', hotel: '/bookings/hotel', esim: '/bookings/esim', insurance: '/bookings/insurance' };

const EMPTY_PASSENGER = {
  title: 'MR',
  fullName: '',
  passengerType: 'ADULT',
  eTicketNumber: '',
  checkInBaggage: '20kg',
  cabinBaggage: '7Kg',
};

const EMPTY_FLIGHT_SEGMENT = {
  airlinePnr: '',
  flightNumber: '',
  aircraft: '',
  departureTime: '',
  arrivalTime: '',
  fromAirportName: '',
  toAirportName: '',
  duration: '',
  distance: '',
  stops: 'Non Stop',
};

function convertFareAmount(amount, from, brlToBdt, usdToBdt) {
  const val = Number(amount) || 0;
  if (!val) return { bdt: 0, usd: 0, brl: 0 };
  if (from === 'BDT') {
    return { bdt: val, usd: usdToBdt > 0 ? val / usdToBdt : 0, brl: brlToBdt > 0 ? val / brlToBdt : 0 };
  }
  if (from === 'USD') {
    const bdt = val * usdToBdt;
    return { bdt, usd: val, brl: brlToBdt > 0 ? bdt / brlToBdt : 0 };
  }
  const bdt = val * brlToBdt;
  return { bdt, usd: usdToBdt > 0 ? bdt / usdToBdt : 0, brl: val };
}

function fareRowFromStored(stored, brlToBdt, usdToBdt) {
  const bdt = stored?.bdt ?? 0;
  return {
    bdt: bdt ? String(bdt) : '',
    usd: stored?.usd ? String(stored.usd) : (usdToBdt > 0 && bdt ? String(bdt / usdToBdt) : ''),
    brl: stored?.brl ? String(stored.brl) : (brlToBdt > 0 && bdt ? String(bdt / brlToBdt) : ''),
  };
}

const EMPTY_FARE_ROW = { bdt: '', usd: '', brl: '' };

const EMPTY_FARE_BREAKDOWN = {
  baseFare: '',
  taxes: '',
  aitVat: '0',
  extraBaggage: '0',
  bundleCost: '0',
};

const CATEGORY_LABELS = {
  air: { airline: 'Airline / Carrier *', route: 'Route *', routePh: 'e.g. DAC → DXB', date: 'Departure Date *' },
  hotel: { airline: 'Hotel name *', route: 'City / Location *', routePh: 'e.g. Makkah — 5 nights', date: 'Check-in Date *' },
  esim: { airline: 'Provider *', route: 'Plan / Region *', routePh: 'e.g. Europe 10GB', date: 'Activation Date *' },
  insurance: { airline: 'Insurer *', route: 'Policy / Coverage *', routePh: 'e.g. Schengen travel', date: 'Start Date *' },
};

export default function BookingFormPage() {
  const navigate = useNavigate();
  const { id: editId } = useParams();
  const [searchParams] = useSearchParams();
  const categoryParam = searchParams.get('category') || 'air';
  const isEdit = Boolean(editId);
  const { brlRate, usdRate } = useCurrency();
  const financeFields = useFieldPermission('finance');
  const paymentFields = useFieldPermission('payments');
  const statusFields = useFieldPermission('status');
  const notesFields = useFieldPermission('notes');

  const [loadingData, setLoadingData] = useState(isEdit);
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [paymentSummary, setPaymentSummary] = useState(null);
  const [travelMeta, setTravelMeta] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');
  const [rateError, setRateError] = useState('');
  const [ticketFile, setTicketFile] = useState(null);
  const [extracting, setExtracting] = useState(false);
  const [extractNote, setExtractNote] = useState('');
  const [existingTicket, setExistingTicket] = useState(null);
  const [fareSale, setFareSale] = useState({ ...EMPTY_FARE_ROW });
  const [farePurchase, setFarePurchase] = useState({ ...EMPTY_FARE_ROW });
  const [fareCosts, setFareCosts] = useState({ ...EMPTY_FARE_ROW });
  const [farePaidInput, setFarePaidInput] = useState({ ...EMPTY_FARE_ROW });
  const [usdRateInput, setUsdRateInput] = useState(usdRate);
  const [duePaymentAt, setDuePaymentAt] = useState('');
  const [accounts, setAccounts] = useState([]);
  const [productCategory, setProductCategory] = useState(categoryParam);
  const [passengers, setPassengers] = useState([{ ...EMPTY_PASSENGER }]);
  const [flightSegment, setFlightSegment] = useState({ ...EMPTY_FLIGHT_SEGMENT });
  const [fareBreakdown, setFareBreakdown] = useState({ ...EMPTY_FARE_BREAKDOWN });

  const form = useForm({
    resolver: zodResolver(isEdit ? baseSchema : createSchema),
    defaultValues: {
      passengerCount: 1,
      purchasePriceBRL: 0,
      salePriceBRL: 0,
      directCostsBRL: 0,
      bdtRate: brlRate,
      status: 'confirmed',
      customerPaymentStatus: 'due',
      customerPaidAmountBRL: 0,
      customerPaymentAccountId: '',
      supplierPaymentStatus: 'due',
      supplierPaidAmountBRL: 0,
      supplierPaymentAccountId: '',
    },
  });

  useEffect(() => {
    if (usdRate) setUsdRateInput(usdRate);
  }, [usdRate]);

  useEffect(() => {
    if (brlRate && !form.getValues('bdtRate')) {
      form.setValue('bdtRate', brlRate);
    }
  }, [brlRate, form]);

  const mergeCustomer = (list, extra) => {
    if (!extra?.id) return list;
    if (list.some((c) => c.id === extra.id)) return list;
    return [{ id: extra.id, name: extra.name, phone: extra.phone }, ...list];
  };

  useEffect(() => {
    setLoadError('');
    Promise.all([
      customersApi.list({ limit: 100, isActive: 'true' }),
      suppliersApi.list({ limit: 100 }),
      accountsApi.list(),
    ])
      .then(([cRes, sRes, aRes]) => {
        setCustomers(cRes.data.data || []);
        setSuppliers(sRes.data.data || []);
        setAccounts((aRes.data.data || []).filter((a) => a.isActive !== false));
      })
      .catch((err) => {
        setCustomers([]);
        setSuppliers([]);
        setLoadError(err.response?.data?.message || 'Could not load customers or suppliers');
      });
  }, []);

  useEffect(() => {
    if (isEdit) {
      setLoadingData(true);
      bookingsApi.get(editId)
        .then(({ data }) => {
          const b = data.data;
          const rate = b.bdtRateAtBooking ?? b.exchangeRateAtBooking ?? b.pricing?.bdtRateAtBooking ?? brlRate;
          form.reset({
            customerId: b.customer || '',
            supplierId: b.supplier || '',
            airline: b.airline,
            route: b.route,
            sector: b.sector || '',
            departureDate: b.departureDate?.slice(0, 10),
            passengerCount: b.passengerCount,
            pnr: b.pnr || '',
            ticketNumber: b.ticketNumber || '',
            purchasePriceBRL: brlFromStored(b, 'purchase', rate),
            salePriceBRL: brlFromStored(b, 'sale', rate),
            directCostsBRL: brlFromStored(b, 'direct', rate),
            bdtRate: rate,
            notes: b.notes || '',
            status: b.status,
          });
          setExistingTicket(b.ticketCopyUrl ? { url: b.ticketCopyUrl, name: b.ticketCopyFileName } : null);
          setProductCategory(b.productCategory || 'air');
          if (b.passengers?.length) {
            setPassengers(b.passengers);
          } else if (b.passengerCount > 1) {
            setPassengers(Array.from({ length: b.passengerCount }, () => ({ ...EMPTY_PASSENGER })));
          }
          if (b.flightSegment) {
            setFlightSegment({ ...EMPTY_FLIGHT_SEGMENT, ...b.flightSegment });
          }
          if (b.fareBreakdown) {
            setFareBreakdown({
              baseFare: b.fareBreakdown.baseFare ?? '',
              taxes: b.fareBreakdown.taxes ?? '',
              aitVat: b.fareBreakdown.aitVat ?? '0',
              extraBaggage: b.fareBreakdown.extraBaggage ?? '0',
              bundleCost: b.fareBreakdown.bundleCost ?? '0',
            });
          }
          setTravelMeta({
            journeyType: b.journeyType || 'one_way',
            travelClass: b.travelClass || 'economy',
            returnDate: b.returnDate?.slice(0, 10) || '',
          });
          if (b.customerName) {
            setCustomers((prev) => mergeCustomer(prev, {
              id: b.customer,
              name: b.customerName,
              phone: b.customerPhone,
            }));
          }
          setPaymentSummary({
            amountPaid: b.amountPaid || 0,
            supplierPaid: b.supplierPaid || 0,
            customerDue: b.computed?.customerDue ?? b.customerDue ?? 0,
            supplierPayable: b.computed?.supplierPayable ?? b.supplierPayable ?? 0,
          });
          const brlToBdt = rate;
          const usdToBdt = b.usdRateAtBooking ?? usdRate;
          setUsdRateInput(usdToBdt);
          setFareSale(fareRowFromStored(b.fareSale || b.fareTotals?.sale, brlToBdt, usdToBdt));
          setFarePurchase(fareRowFromStored(b.farePurchase || b.fareTotals?.purchase, brlToBdt, usdToBdt));
          setFareCosts(fareRowFromStored(b.fareCosts || b.fareTotals?.costs, brlToBdt, usdToBdt));
          setFarePaidInput(fareRowFromStored(b.farePaid || b.fareTotals?.paid, brlToBdt, usdToBdt));
          if (b.duePaymentAt) {
            const d = new Date(b.duePaymentAt);
            const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
            setDuePaymentAt(local.toISOString().slice(0, 16));
          }
        })
        .catch((err) => setLoadError(err.response?.data?.message || 'Failed to load booking'))
        .finally(() => setLoadingData(false));
    }
  }, [editId, isEdit, form, brlRate, usdRate]);

  const fareRowToPayload = (row) => ({
    bdt: Number(row.bdt) || 0,
    usd: Number(row.usd) || 0,
    brl: Number(row.brl) || 0,
  });

  const handleTicketFileChange = async (file) => {
    setTicketFile(file);
    setExtractNote('');
    if (!file) return;

    const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
    if (!isPdf) {
      setExtractNote('Image tickets need manual entry — use a PDF for auto-fill.');
      return;
    }

    const setField = (name, value) => {
      if (value == null || value === '') return;
      form.setValue(name, value, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
    };

    setExtracting(true);
    try {
      const res = await bookingsApi.extractTicket(file);
      const ex = res.data?.data;
      if (!ex || typeof ex !== 'object') {
        throw new Error('Invalid OCR response');
      }

      const mappedPassengers = ex.passengers?.length
        ? ex.passengers.map((p) => ({
          ...EMPTY_PASSENGER,
          ...p,
          title: p.title || 'MR',
          passengerType: p.passengerType || 'ADULT',
        }))
        : null;
      const count = mappedPassengers?.length || ex.passengerCount || 1;

      if (mappedPassengers) {
        setPassengers(mappedPassengers);
      }
      setField('passengerCount', count);
      setField('pnr', ex.pnr);
      setField('airline', ex.airline);
      setField('route', ex.route);
      setField('sector', ex.sector);
      setField('departureDate', ex.departureDate);
      setField('ticketNumber', ex.ticketNumber || ex.bookingId);

      if (ex.flightSegment) {
        setFlightSegment((prev) => ({
          ...prev,
          ...ex.flightSegment,
          airlinePnr: ex.flightSegment.airlinePnr || ex.pnr || prev.airlinePnr,
          flightNumber: ex.flightSegment.flightNumber || ex.flightNumber || prev.flightNumber,
        }));
      } else if (ex.flightNumber || ex.pnr) {
        setFlightSegment((prev) => ({
          ...prev,
          flightNumber: ex.flightNumber || prev.flightNumber,
          airlinePnr: ex.pnr || prev.airlinePnr,
        }));
      }

      const bdtTotal = Number(ex.grandTotalBdt || ex.purchasePriceBdt || ex.salePriceBdt) || 0;
      if (bdtTotal > 0) {
        const rate = Number(form.getValues('bdtRate')) || brlRate || 22.5;
        const brlAmount = rate > 0 ? Number((bdtTotal / rate).toFixed(2)) : bdtTotal;
        setField('purchasePriceBRL', brlAmount);
        setField('salePriceBRL', brlAmount);
        const fareRow = { bdt: String(bdtTotal), usd: '', brl: String(brlAmount) };
        setFarePurchase(fareRow);
        setFareSale(fareRow);
        setFareBreakdown((prev) => ({
          ...prev,
          baseFare: String(bdtTotal),
          grandTotal: bdtTotal,
        }));
      }

      if (ex.travelClass) {
        setTravelMeta((prev) => ({
          ...(prev || { journeyType: 'one_way', travelClass: 'economy', returnDate: '' }),
          travelClass: ex.travelClass,
        }));
      }

      const filled = [ex.airline, ex.route, ex.departureDate, ex.pnr, ex.ticketNumber].filter(Boolean).length;
      setExtractNote(
        ex.note
        || (filled >= 3
          ? `Auto-filled ${filled} fields from ticket — please verify before saving`
          : 'Partial data extracted — complete remaining fields manually')
      );
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Could not extract ticket data';
      setExtractNote(`${msg}. Enter details manually.`);
    } finally {
      setExtracting(false);
    }
  };

  const watchPrices = form.watch(['purchasePriceBRL', 'salePriceBRL', 'directCostsBRL', 'bdtRate']);
  const customerPaymentStatus = form.watch('customerPaymentStatus');
  const supplierPaymentStatus = form.watch('supplierPaymentStatus');
  const customerPaidAmountBRL = Number(form.watch('customerPaidAmountBRL')) || 0;
  const supplierPaidAmountBRL = Number(form.watch('supplierPaidAmountBRL')) || 0;
  const purchaseBRL = Number(watchPrices[0]) || 0;
  const saleBRL = Number(watchPrices[1]) || 0;
  const costsBRL = Number(watchPrices[2]) || 0;
  const effectiveRate = Number(watchPrices[3] || brlRate) || 0;
  const usdToBdt = Number(usdRateInput) || usdRate;

  const updateFareRow = (setter, currency, value) => {
    const converted = convertFareAmount(value, currency, effectiveRate, usdToBdt);
    setter({
      bdt: converted.bdt ? String(Number(converted.bdt.toFixed(2))) : '',
      usd: converted.usd ? String(Number(converted.usd.toFixed(2))) : '',
      brl: converted.brl ? String(Number(converted.brl.toFixed(2))) : '',
    });
    if (setter === setFareSale && converted.brl) {
      form.setValue('salePriceBRL', Number(converted.brl.toFixed(2)));
    }
    if (setter === setFarePurchase && converted.brl) {
      form.setValue('purchasePriceBRL', Number(converted.brl.toFixed(2)));
    }
    if (setter === setFareCosts && converted.brl) {
      form.setValue('directCostsBRL', Number(converted.brl.toFixed(2)));
    }
  };

  useEffect(() => {
    if (isEdit) return;
    if (customerPaymentStatus === 'due') {
      form.setValue('customerPaidAmountBRL', 0);
      form.setValue('customerPaymentAccountId', '');
    } else if (customerPaymentStatus === 'paid' && saleBRL > 0) {
      form.setValue('customerPaidAmountBRL', saleBRL);
    }
  }, [customerPaymentStatus, saleBRL, isEdit, form]);

  useEffect(() => {
    if (isEdit) return;
    const purchaseTotal = purchaseBRL + costsBRL;
    if (supplierPaymentStatus === 'due') {
      form.setValue('supplierPaidAmountBRL', 0);
      form.setValue('supplierPaymentAccountId', '');
    } else if (supplierPaymentStatus === 'paid' && purchaseTotal > 0) {
      form.setValue('supplierPaidAmountBRL', purchaseTotal);
    }
  }, [supplierPaymentStatus, purchaseBRL, costsBRL, isEdit, form]);

  const profitBRL = saleBRL - purchaseBRL - costsBRL;
  const profitBDT = profitBRL * effectiveRate;
  const saleBDT = saleBRL * effectiveRate;
  const projectedDueBDT = isEdit
    ? Math.max(0, saleBDT - (paymentSummary?.amountPaid || 0))
    : Math.max(0, saleBDT - customerPaidAmountBRL * effectiveRate);
  const projectedDueBRL = effectiveRate > 0 ? projectedDueBDT / effectiveRate : projectedDueBDT;
  const purchaseTotalBRL = purchaseBRL + costsBRL;
  const projectedPayableBDT = isEdit
    ? Math.max(0, purchaseTotalBRL * effectiveRate - (paymentSummary?.supplierPaid || 0))
    : Math.max(0, purchaseTotalBRL * effectiveRate - supplierPaidAmountBRL * effectiveRate);
  const projectedPayableBRL = effectiveRate > 0 ? projectedPayableBDT / effectiveRate : projectedPayableBDT;

  const saleBdtFromFare = Number(fareSale.bdt) || saleBDT;
  const purchaseBdtFromFare = Number(farePurchase.bdt) || purchaseBRL * effectiveRate;
  const costsBdtFromFare = Number(fareCosts.bdt) || costsBRL * effectiveRate;
  const paidBdtFromFare = Number(farePaidInput.bdt) || (isEdit ? (paymentSummary?.amountPaid || 0) : customerPaidAmountBRL * effectiveRate);
  const fullDueBdt = Math.max(0, saleBdtFromFare - paidBdtFromFare);
  const balanceBdt = fullDueBdt;

  const passengerCount = Number(form.watch('passengerCount')) || 1;

  useEffect(() => {
    if (productCategory !== 'air') return;
    setPassengers((prev) => {
      if (prev.length === passengerCount) return prev;
      if (prev.length < passengerCount) {
        return [...prev, ...Array.from({ length: passengerCount - prev.length }, () => ({ ...EMPTY_PASSENGER }))];
      }
      return prev.slice(0, passengerCount);
    });
  }, [passengerCount, productCategory]);

  const updatePassenger = (index, field, value) => {
    setPassengers((prev) => prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)));
  };

  const updateFlightSegment = (field, value) => {
    setFlightSegment((prev) => ({ ...prev, [field]: value }));
  };

  const updateFareBreakdown = (field, value) => {
    setFareBreakdown((prev) => ({ ...prev, [field]: value }));
  };

  const buildETicketPayload = () => {
    if (productCategory !== 'air') return {};
    const filledPassengers = passengers
      .filter((p) => p.fullName?.trim())
      .map((p) => ({
        title: p.title || 'MR',
        fullName: p.fullName.trim(),
        passengerType: p.passengerType || 'ADULT',
        eTicketNumber: p.eTicketNumber || undefined,
        checkInBaggage: p.checkInBaggage || '20kg',
        cabinBaggage: p.cabinBaggage || '7Kg',
      }));
    const fs = Object.fromEntries(
      Object.entries(flightSegment).filter(([, v]) => v != null && String(v).trim() !== '')
    );
    const fb = {};
    if (fareBreakdown.baseFare !== '') fb.baseFare = Number(fareBreakdown.baseFare);
    if (fareBreakdown.taxes !== '') fb.taxes = Number(fareBreakdown.taxes);
    if (fareBreakdown.aitVat !== '') fb.aitVat = Number(fareBreakdown.aitVat);
    if (fareBreakdown.extraBaggage !== '') fb.extraBaggage = Number(fareBreakdown.extraBaggage);
    if (fareBreakdown.bundleCost !== '') fb.bundleCost = Number(fareBreakdown.bundleCost);
    fb.grandTotal = saleBDT;
    return {
      passengers: filledPassengers.length ? filledPassengers : undefined,
      flightSegment: Object.keys(fs).length ? fs : undefined,
      fareBreakdown: Object.keys(fb).length ? fb : undefined,
    };
  };

  const accountLabel = (a) => `${a.name} (${ACCOUNT_TYPE_LABELS[a.type] || a.type})`;

  const renderFareInputs = (label, row, setter) => (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <p className="mb-2 text-xs font-semibold uppercase text-slate-500">{label}</p>
      <div className="grid gap-2 sm:grid-cols-3">
        {['bdt', 'usd', 'brl'].map((cur) => (
          <div key={cur}>
            <label className="mb-1 block text-xs text-slate-500">{cur.toUpperCase()}</label>
            <input
              type="number"
              min={0}
              step="0.01"
              className="input-field"
              value={row[cur]}
              disabled={financeFields.readOnly}
              onChange={(e) => updateFareRow(setter, cur.toUpperCase(), e.target.value)}
            />
          </div>
        ))}
      </div>
    </div>
  );

  const onSubmit = async (values) => {
    if (!effectiveRate || effectiveRate <= 0) {
      setRateError('BDT rate must be greater than 0');
      return;
    }
    setError('');
    try {
      const { fromDestination, toDestination } = parseRoute(values.route);
      const payload = {
        ...values,
        ...buildETicketPayload(),
        productCategory,
        supplierId: values.supplierId || undefined,
        customerId: values.customerId || undefined,
        journeyType: travelMeta?.journeyType || 'one_way',
        travelClass: travelMeta?.travelClass || 'economy',
        returnDate: travelMeta?.returnDate || undefined,
        fromDestination,
        toDestination,
        customerPaymentAccountId: values.customerPaymentAccountId || undefined,
        supplierPaymentAccountId: values.supplierPaymentAccountId || undefined,
        fareSale: fareRowToPayload(fareSale),
        farePurchase: fareRowToPayload(farePurchase),
        fareCosts: fareRowToPayload(fareCosts),
        usdRateAtBooking: usdToBdt,
        duePaymentAt: duePaymentAt || undefined,
      };
      if (isEdit) {
        delete payload.customerPaymentStatus;
        delete payload.customerPaidAmountBRL;
        delete payload.customerPaymentAccountId;
        delete payload.supplierPaymentStatus;
        delete payload.supplierPaidAmountBRL;
        delete payload.supplierPaymentAccountId;
        await bookingsApi.update(editId, payload);
        if (ticketFile) await bookingsApi.uploadTicket(editId, ticketFile);
        navigate(`/bookings/${editId}`);
      } else {
        const { data } = await bookingsApi.create(payload);
        const bookingId = data.data.id;
        if (ticketFile) await bookingsApi.uploadTicket(bookingId, ticketFile);
        navigate(`/bookings/${bookingId}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || (isEdit ? 'Failed to update booking' : 'Failed to create booking'));
    }
  };

  if (loadingData) return <LoadingSpinner className="py-20" />;

  const backLink = isEdit ? `/bookings/${editId}` : (CATEGORY_PATHS[productCategory] || '/bookings');
  const title = isEdit ? 'Edit Booking' : `New ${PRODUCT_CATEGORY_LABELS[productCategory] || 'Booking'}`;
  const fieldLabels = CATEGORY_LABELS[productCategory] || CATEGORY_LABELS.air;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link to={backLink} className="text-sm text-brand-600 hover:underline">← Back</Link>
        <h2 className="mt-2 text-xl font-bold text-slate-900">{title}</h2>
        {!isEdit && (
          <p className="mt-1 text-sm text-slate-500">
            No customer yet?{' '}
            <Link to="/customers" className="font-medium text-brand-600 hover:underline">Add a customer first</Link>
          </p>
        )}
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="card space-y-4">
        {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        {loadError && <div className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">{loadError}</div>}
        {(extractNote || extracting) && (
          <div className={`rounded-lg px-3 py-2 text-sm ${extracting ? 'bg-blue-50 text-blue-800' : extractNote?.includes('manual') || extractNote?.includes('Could not') ? 'bg-amber-50 text-amber-800' : 'bg-green-50 text-green-800'}`}>
            {extracting ? 'Reading ticket PDF and filling fields…' : extractNote}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Customer *</label>
            <select className="input-field" {...form.register('customerId')}>
              <option value="">Select customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name} — {c.phone}</option>
              ))}
            </select>
            {form.formState.errors.customerId && (
              <p className="mt-1 text-xs text-red-600">{form.formState.errors.customerId.message}</p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Supplier / Agent</label>
            <select className="input-field" {...form.register('supplierId')}>
              <option value="">Select supplier</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">{fieldLabels.airline}</label>
            <input className="input-field" placeholder={productCategory === 'air' ? 'e.g. Emirates, Biman' : ''} {...form.register('airline')} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{fieldLabels.route}</label>
            <input className="input-field uppercase" placeholder={fieldLabels.routePh} {...form.register('route')} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Sector</label>
            <input className="input-field" {...form.register('sector')} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{fieldLabels.date}</label>
            <input type="date" className="input-field" {...form.register('departureDate')} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Passengers</label>
            <input type="number" min={1} className="input-field" {...form.register('passengerCount')} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Status</label>
            {statusFields.hidden ? (
              <p className="text-xs text-slate-500">Status hidden for your role</p>
            ) : (
              <select className="input-field" disabled={statusFields.readOnly} {...form.register('status')}>
                {BOOKING_STATUSES.map((s) => <option key={s} value={s}>{BOOKING_STATUS_LABELS[s]}</option>)}
              </select>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">PNR</label>
            <input className="input-field" {...form.register('pnr')} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Ticket Number</label>
            <input className="input-field" {...form.register('ticketNumber')} />
          </div>
        </div>

        {productCategory === 'air' && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">E-Ticket Details</h3>
              <p className="mt-1 text-xs text-slate-500">Passenger and flight info used when generating the E-Ticket PDF.</p>
            </div>

            <div className="space-y-3">
              {passengers.map((p, idx) => (
                <div key={idx} className="rounded-lg border border-slate-200 bg-white p-3">
                  <p className="mb-2 text-xs font-semibold uppercase text-slate-500">Passenger {idx + 1}</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-medium">Title</label>
                      <select className="input-field" value={p.title} onChange={(e) => updatePassenger(idx, 'title', e.target.value)}>
                        <option value="MR">MR</option>
                        <option value="MRS">MRS</option>
                        <option value="MS">MS</option>
                        <option value="MSTR">MSTR</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium">Full Name *</label>
                      <input className="input-field" value={p.fullName} onChange={(e) => updatePassenger(idx, 'fullName', e.target.value)} />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium">Type</label>
                      <select className="input-field" value={p.passengerType} onChange={(e) => updatePassenger(idx, 'passengerType', e.target.value)}>
                        <option value="ADULT">ADULT</option>
                        <option value="CHILD">CHILD</option>
                        <option value="INFANT">INFANT</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium">E-Ticket No</label>
                      <input className="input-field" value={p.eTicketNumber} onChange={(e) => updatePassenger(idx, 'eTicketNumber', e.target.value)} />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium">Check-in Baggage</label>
                      <input className="input-field" value={p.checkInBaggage} onChange={(e) => updatePassenger(idx, 'checkInBaggage', e.target.value)} />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium">Cabin Baggage</label>
                      <input className="input-field" value={p.cabinBaggage} onChange={(e) => updatePassenger(idx, 'cabinBaggage', e.target.value)} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium">Airline PNR</label>
                <input className="input-field" value={flightSegment.airlinePnr} onChange={(e) => updateFlightSegment('airlinePnr', e.target.value)} placeholder="e.g. ANGMMK" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Flight Number</label>
                <input className="input-field" value={flightSegment.flightNumber} onChange={(e) => updateFlightSegment('flightNumber', e.target.value)} placeholder="e.g. BG-248" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Aircraft</label>
                <input className="input-field" value={flightSegment.aircraft} onChange={(e) => updateFlightSegment('aircraft', e.target.value)} placeholder="e.g. Boeing 737-800" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Stops</label>
                <input className="input-field" value={flightSegment.stops} onChange={(e) => updateFlightSegment('stops', e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Departure Time</label>
                <input className="input-field" value={flightSegment.departureTime} onChange={(e) => updateFlightSegment('departureTime', e.target.value)} placeholder="08:00" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Arrival Time</label>
                <input className="input-field" value={flightSegment.arrivalTime} onChange={(e) => updateFlightSegment('arrivalTime', e.target.value)} placeholder="09:05" />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium">From Airport</label>
                <input className="input-field" value={flightSegment.fromAirportName} onChange={(e) => updateFlightSegment('fromAirportName', e.target.value)} placeholder="Osmany Intl Airport (ZYL)" />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium">To Airport</label>
                <input className="input-field" value={flightSegment.toAirportName} onChange={(e) => updateFlightSegment('toAirportName', e.target.value)} placeholder="Hazrat Shahjalal Intl Airport (DAC)" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Duration</label>
                <input className="input-field" value={flightSegment.duration} onChange={(e) => updateFlightSegment('duration', e.target.value)} placeholder="1h 5m" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Distance</label>
                <input className="input-field" value={flightSegment.distance} onChange={(e) => updateFlightSegment('distance', e.target.value)} placeholder="124 mi" />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-medium">Base Fare (BDT)</label>
                <input type="number" min={0} step="0.01" className="input-field" value={fareBreakdown.baseFare} onChange={(e) => updateFareBreakdown('baseFare', e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Taxes (BDT)</label>
                <input type="number" min={0} step="0.01" className="input-field" value={fareBreakdown.taxes} onChange={(e) => updateFareBreakdown('taxes', e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">AIT & VAT (BDT)</label>
                <input type="number" min={0} step="0.01" className="input-field" value={fareBreakdown.aitVat} onChange={(e) => updateFareBreakdown('aitVat', e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {!financeFields.hidden && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Multi-Currency Fare</h3>
            <p className="mt-1 text-xs text-slate-500">Enter in any currency — BDT, USD, and BRL convert automatically. All fields remain editable.</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium">BRL → BDT Rate</label>
              <input type="number" min={0.01} step="0.01" className="input-field" value={effectiveRate} readOnly />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">USD → BDT Rate</label>
              <input
                type="number"
                min={0.01}
                step="0.01"
                className="input-field"
                value={usdRateInput}
                onChange={(e) => setUsdRateInput(Number(e.target.value) || usdRate)}
              />
            </div>
          </div>
          <div className="grid gap-3 lg:grid-cols-3">
            {renderFareInputs('Sale Price', fareSale, setFareSale)}
            {renderFareInputs('Purchase Price', farePurchase, setFarePurchase)}
            {renderFareInputs('Direct Costs', fareCosts, setFareCosts)}
          </div>
          {isEdit && renderFareInputs('Total Paid', farePaidInput, setFarePaidInput)}
          <div className="grid gap-3 sm:grid-cols-3 rounded-lg border border-slate-200 bg-white p-3">
            <div>
              <p className="text-xs text-slate-500">Full Due (BDT)</p>
              <p className="text-lg font-semibold text-red-700">৳ {fmt(fullDueBdt)}</p>
              <p className="text-xs text-slate-400">${fmt(usdToBdt > 0 ? fullDueBdt / usdToBdt : 0)} · R$ {fmt(effectiveRate > 0 ? fullDueBdt / effectiveRate : 0)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Balance (BDT)</p>
              <p className="text-lg font-semibold text-amber-700">৳ {fmt(balanceBdt)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Total Sale (BDT)</p>
              <p className="text-lg font-semibold text-slate-900">৳ {fmt(saleBdtFromFare)}</p>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">Due Payment Date & Time</label>
            <input
              type="datetime-local"
              className="input-field max-w-xs"
              value={duePaymentAt}
              onChange={(e) => setDuePaymentAt(e.target.value)}
            />
          </div>
        </div>
        )}

        {!financeFields.hidden && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <h3 className="text-sm font-semibold text-slate-900">Pricing (BRL)</h3>
          <p className="mt-1 text-xs text-slate-500">
            Enter amounts in BRL. Payment records update account balances automatically.
          </p>
          <div className="mt-3 grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium">Purchase Price</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">R$</span>
                <input type="number" min={0} step="0.01" disabled={financeFields.readOnly} className="input-field pl-9" {...form.register('purchasePriceBRL')} />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">Sale Price</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">R$</span>
                <input type="number" min={0} step="0.01" disabled={financeFields.readOnly} className="input-field pl-9" {...form.register('salePriceBRL')} />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">Direct Costs</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">R$</span>
                <input type="number" min={0} step="0.01" disabled={financeFields.readOnly} className="input-field pl-9" {...form.register('directCostsBRL')} />
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-slate-200 bg-white p-3">
            <label className="mb-1 block text-xs font-medium">BDT Exchange Rate *</label>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-slate-600">1 BRL = ৳</span>
              <input
                type="number"
                min={0.01}
                step="0.01"
                className="input-field w-28"
                {...form.register('bdtRate', {
                  onChange: (e) => setRateError(Number(e.target.value) > 0 ? '' : 'BDT rate must be greater than 0'),
                })}
              />
            </div>
            {rateError && <p className="mt-1 text-xs text-red-600">{rateError}</p>}
            <p className="mt-2 text-xs text-slate-500">100 BRL = ৳ {fmt(100 * effectiveRate)} at this rate</p>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-slate-500">Est. Profit</p>
              <DualCurrencyAmount totalBRL={profitBRL} totalBDT={profitBDT} size="lg" className="mt-1 text-green-700" />
            </div>
            {isEdit && paymentSummary ? (
              <>
                <div>
                  <p className="text-xs text-slate-500">Customer Due</p>
                  <DualCurrencyAmount totalBRL={projectedDueBRL} totalBDT={projectedDueBDT} size="md" className="mt-1" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Supplier Payable</p>
                  <DualCurrencyAmount totalBRL={projectedPayableBRL} totalBDT={projectedPayableBDT} size="md" className="mt-1" />
                </div>
              </>
            ) : !isEdit ? (
              <>
                <div>
                  <p className="text-xs text-slate-500">Customer Due (est.)</p>
                  <DualCurrencyAmount totalBRL={projectedDueBRL} totalBDT={projectedDueBDT} size="md" className="mt-1" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Supplier Payable (est.)</p>
                  <DualCurrencyAmount totalBRL={projectedPayableBRL} totalBDT={projectedPayableBDT} size="md" className="mt-1" />
                </div>
              </>
            ) : null}
          </div>
          <p className="mt-3 text-xs text-slate-500">Rate used: 1 BRL = ৳ {fmt(effectiveRate)}</p>
        </div>
        )}

        {!isEdit && !paymentFields.hidden && (
          <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Payments at booking</h3>
              <p className="mt-1 text-xs text-slate-500">
                Optional. Paid amounts create customer/supplier payment records and update the selected account balance.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-3 rounded-lg border border-slate-100 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase text-slate-500">Customer payment</p>
                <div>
                  <label className="mb-1 block text-xs font-medium">Status</label>
                  <select className="input-field" {...form.register('customerPaymentStatus')}>
                    <option value="due">Due</option>
                    <option value="paid">Paid / Partial</option>
                  </select>
                </div>
                {customerPaymentStatus === 'paid' && (
                  <>
                    <div>
                      <label className="mb-1 block text-xs font-medium">Paid amount (BRL)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">R$</span>
                        <input type="number" min={0} step="0.01" max={saleBRL} className="input-field pl-9" {...form.register('customerPaidAmountBRL')} />
                      </div>
                      {form.formState.errors.customerPaidAmountBRL && (
                        <p className="mt-1 text-xs text-red-600">{form.formState.errors.customerPaidAmountBRL.message}</p>
                      )}
                      <p className="mt-1 text-xs text-slate-500">≈ ৳ {fmt(customerPaidAmountBRL * effectiveRate)}</p>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium">Receive into account *</label>
                      <select className="input-field" {...form.register('customerPaymentAccountId')}>
                        <option value="">Select account</option>
                        {accounts.map((a) => (
                          <option key={a.id} value={a.id}>{accountLabel(a)}</option>
                        ))}
                      </select>
                      {form.formState.errors.customerPaymentAccountId && (
                        <p className="mt-1 text-xs text-red-600">{form.formState.errors.customerPaymentAccountId.message}</p>
                      )}
                    </div>
                  </>
                )}
              </div>

              <div className="space-y-3 rounded-lg border border-slate-100 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase text-slate-500">Supplier payment</p>
                <div>
                  <label className="mb-1 block text-xs font-medium">Status</label>
                  <select className="input-field" {...form.register('supplierPaymentStatus')}>
                    <option value="due">Due</option>
                    <option value="paid">Paid / Partial</option>
                  </select>
                </div>
                {supplierPaymentStatus === 'paid' && (
                  <>
                    <div>
                      <label className="mb-1 block text-xs font-medium">Paid amount (BRL)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">R$</span>
                        <input type="number" min={0} step="0.01" max={purchaseTotalBRL} className="input-field pl-9" {...form.register('supplierPaidAmountBRL')} />
                      </div>
                      {form.formState.errors.supplierPaidAmountBRL && (
                        <p className="mt-1 text-xs text-red-600">{form.formState.errors.supplierPaidAmountBRL.message}</p>
                      )}
                      <p className="mt-1 text-xs text-slate-500">≈ ৳ {fmt(supplierPaidAmountBRL * effectiveRate)}</p>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium">Pay from account *</label>
                      <select className="input-field" {...form.register('supplierPaymentAccountId')}>
                        <option value="">Select account</option>
                        {accounts.map((a) => (
                          <option key={a.id} value={a.id}>{accountLabel(a)}</option>
                        ))}
                      </select>
                      {form.formState.errors.supplierPaymentAccountId && (
                        <p className="mt-1 text-xs text-red-600">{form.formState.errors.supplierPaymentAccountId.message}</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {isEdit && paymentSummary && (
          <div className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            Payments are managed under{' '}
            <Link to="/payments/customers" className="font-medium underline">Customer Payments</Link>
            {' '}and{' '}
            <Link to="/payments/suppliers" className="font-medium underline">Supplier Payments</Link>.
            Editing this booking does not create duplicate payment records.
          </div>
        )}

        {productCategory === 'air' && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <label className="mb-1 block text-sm font-medium">Original Ticket</label>
            <p className="mb-2 text-xs text-slate-500">
              Upload PDF ticket — auto-fills airline, route, date, PNR, passengers, and price. Included as a download link on the invoice PDF.
            </p>
            {existingTicket?.url && (
              <a href={existingTicket.url} target="_blank" rel="noopener noreferrer" className="mb-2 inline-block text-sm font-medium text-brand-600 hover:underline">
                {existingTicket.name || 'View current ticket'}
              </a>
            )}
            <input
              type="file"
              accept="application/pdf,image/jpeg,image/png,image/webp"
              className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-700"
              onChange={(e) => handleTicketFileChange(e.target.files?.[0] || null)}
            />
            {ticketFile && <p className="mt-1 text-xs text-slate-500">Selected: {ticketFile.name}</p>}
          </div>
        )}

        {!notesFields.hidden && (
        <div>
          <label className="mb-1 block text-sm font-medium">Notes</label>
          <textarea rows={3} disabled={notesFields.readOnly} className="input-field" {...form.register('notes')} />
        </div>
        )}

        <div className="flex justify-end gap-2">
          <Link to={backLink} className="btn-secondary">Cancel</Link>
          <button type="submit" className="btn-primary" disabled={Boolean(loadError)}>
            {isEdit ? 'Save Changes' : 'Create Booking'}
          </button>
        </div>
      </form>
    </div>
  );
}

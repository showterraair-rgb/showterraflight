import BookingOperation from '../models/BookingOperation.js';
import Booking from '../models/Booking.js';
import ApiError from '../utils/ApiError.js';
import { generateOperationNumber } from './numberGenerator.service.js';

function formatOperation(doc, { legacy = false } = {}) {
  return {
    id: doc._id?.toString?.() || doc.id,
    operationNumber: doc.operationNumber,
    bookingId: doc.booking?._id?.toString?.() || doc.booking?.toString?.() || doc.bookingId,
    operationType: doc.operationType,
    operationDate: doc.operationDate,
    oldTicketNumber: doc.oldTicketNumber || '',
    newTicketNumber: doc.newTicketNumber || '',
    supplierAdjustmentBRL: doc.supplierAdjustmentBRL ?? 0,
    saleAdjustmentBRL: doc.saleAdjustmentBRL ?? 0,
    penaltyBRL: doc.penaltyBRL ?? 0,
    serviceChargeBRL: doc.serviceChargeBRL ?? 0,
    refundAmountBRL: doc.refundAmountBRL ?? 0,
    receivedAdjustmentBRL: doc.receivedAdjustmentBRL ?? 0,
    payableAdjustmentBRL: doc.payableAdjustmentBRL ?? 0,
    exchangeRateBrlToBdt: doc.exchangeRateBrlToBdt,
    remarks: doc.remarks || '',
    status: doc.status,
    legacyChildBooking: doc.legacyChildBooking?._id?.toString?.() || doc.legacyChildBooking?.toString?.() || null,
    legacyChildBookingNumber: doc.legacyChildBooking?.bookingNumber || doc.legacyChildBookingNumber || null,
    financialApplied: doc.financialApplied ?? false,
    legacy,
    createdAt: doc.createdAt,
  };
}

function bdtToBrl(amountBdt, rate) {
  const n = Number(amountBdt) || 0;
  const r = Number(rate) || 0;
  return r > 0 ? n / r : n;
}

function brlFromBooking(booking, field) {
  const rate = booking.bdtRateAtBooking ?? booking.exchangeRateAtBooking ?? 1;
  if (field === 'sale') {
    return booking.salePriceBRL ?? (rate > 0 ? (booking.salePrice || 0) / rate : booking.salePrice || 0);
  }
  if (field === 'purchase') {
    const purchaseBrl = booking.purchasePriceBRL ?? (rate > 0 ? (booking.purchasePrice || 0) / rate : booking.purchasePrice || 0);
    const costsBrl = booking.directCostsBRL ?? (rate > 0 ? (booking.directCosts || 0) / rate : booking.directCosts || 0);
    return purchaseBrl + costsBrl;
  }
  return 0;
}

function buildLegacyOperations(booking, childBookings = []) {
  const rate = booking.bdtRateAtBooking ?? booking.exchangeRateAtBooking ?? 1;
  const ops = [{
    id: `legacy-issue-${booking._id}`,
    operationNumber: '—',
    bookingId: booking._id.toString(),
    operationType: 'ISSUE',
    operationDate: booking.createdAt,
    oldTicketNumber: '',
    newTicketNumber: booking.ticketNumber || '',
    supplierAdjustmentBRL: brlFromBooking(booking, 'purchase'),
    saleAdjustmentBRL: brlFromBooking(booking, 'sale'),
    penaltyBRL: 0,
    serviceChargeBRL: 0,
    refundAmountBRL: 0,
    receivedAdjustmentBRL: bdtToBrl(booking.amountPaid || 0, rate),
    payableAdjustmentBRL: bdtToBrl(booking.supplierPaid || 0, rate),
    exchangeRateBrlToBdt: rate,
    remarks: 'Original booking issued (migrated from ledger)',
    status: 'completed',
    legacy: true,
    createdAt: booking.createdAt,
  }];

  if (booking.status === 'voided' || booking.bookingType === 'void') {
    ops.push({
      id: `legacy-void-${booking._id}`,
      operationNumber: '—',
      bookingId: booking._id.toString(),
      operationType: 'VOID',
      operationDate: booking.rrvProcessedAt || booking.updatedAt,
      oldTicketNumber: booking.ticketNumber || '',
      newTicketNumber: '',
      penaltyBRL: 0,
      refundAmountBRL: 0,
      exchangeRateBrlToBdt: rate,
      remarks: booking.rrvNote || 'Booking voided',
      status: 'completed',
      legacy: true,
      createdAt: booking.rrvProcessedAt || booking.updatedAt,
    });
  }

  if (booking.status === 'refunded' || booking.bookingType === 'refund') {
    ops.push({
      id: `legacy-refund-${booking._id}`,
      operationNumber: '—',
      bookingId: booking._id.toString(),
      operationType: 'REFUND',
      operationDate: booking.rrvProcessedAt || booking.updatedAt,
      oldTicketNumber: booking.ticketNumber || '',
      newTicketNumber: '',
      penaltyBRL: bdtToBrl(booking.rrvPenalty || 0, rate),
      refundAmountBRL: bdtToBrl(booking.rrvRefundAmount || 0, rate),
      exchangeRateBrlToBdt: rate,
      remarks: booking.rrvNote || 'Booking refunded',
      status: 'completed',
      legacy: true,
      createdAt: booking.rrvProcessedAt || booking.updatedAt,
    });
  }

  if (booking.status === 'reissued' || booking.bookingType === 'reissue') {
    const child = childBookings[0];
    ops.push({
      id: `legacy-reissue-${booking._id}`,
      operationNumber: '—',
      bookingId: booking._id.toString(),
      operationType: 'REISSUE',
      operationDate: booking.rrvProcessedAt || booking.updatedAt,
      oldTicketNumber: booking.ticketNumber || '',
      newTicketNumber: child?.ticketNumber || '',
      legacyChildBooking: child?._id?.toString?.(),
      legacyChildBookingNumber: child?.bookingNumber || '',
      exchangeRateBrlToBdt: rate,
      remarks: booking.rrvNote || (child ? `Reissued as ${child.bookingNumber}` : 'Booking reissued'),
      status: 'completed',
      legacy: true,
      createdAt: booking.rrvProcessedAt || booking.updatedAt,
    });
  }

  return ops;
}

async function operationExists(bookingId, operationType, extra = {}) {
  const filter = { booking: bookingId, operationType, status: 'completed', ...extra };
  return Boolean(await BookingOperation.exists(filter));
}

async function pendingRefundExists(bookingId) {
  return Boolean(await BookingOperation.exists({ booking: bookingId, operationType: 'REFUND', status: 'pending' }));
}

export async function recordBookingOperation(data) {
  if (data.operationType && data.bookingId) {
    const dupFilter = {};
    if (data.operationType === 'REISSUE' && data.legacyChildBooking) {
      dupFilter.legacyChildBooking = data.legacyChildBooking;
    }
    if (await operationExists(data.bookingId, data.operationType, dupFilter)) {
      return null;
    }
  }

  const operationNumber = await generateOperationNumber();
  const op = await BookingOperation.create({
    operationNumber,
    booking: data.bookingId,
    operationType: data.operationType,
    operationDate: data.operationDate || new Date(),
    oldTicketNumber: data.oldTicketNumber || '',
    newTicketNumber: data.newTicketNumber || '',
    supplierAdjustmentBRL: data.supplierAdjustmentBRL ?? 0,
    saleAdjustmentBRL: data.saleAdjustmentBRL ?? 0,
    penaltyBRL: data.penaltyBRL ?? 0,
    serviceChargeBRL: data.serviceChargeBRL ?? 0,
    refundAmountBRL: data.refundAmountBRL ?? 0,
    receivedAdjustmentBRL: data.receivedAdjustmentBRL ?? 0,
    payableAdjustmentBRL: data.payableAdjustmentBRL ?? 0,
    exchangeRateBrlToBdt: data.exchangeRateBrlToBdt,
    remarks: data.remarks || '',
    status: data.status || 'completed',
    legacyChildBooking: data.legacyChildBooking,
    financialApplied: data.financialApplied ?? true,
    createdBy: data.userId,
  });
  return formatOperation(op.toObject());
}

export async function backfillBookingOperations({ dryRun = false, userId = null } = {}) {
  const bookings = await Booking.find()
    .select('_id bookingNumber status bookingType passengers passengerName saleType agent parentBooking ticketNumber createdAt updatedAt bdtRateAtBooking exchangeRateAtBooking salePrice purchasePrice directCosts amountPaid supplierPaid rrvNote rrvPenalty rrvRefundAmount rrvProcessedAt rrvProcessedBy salePriceBRL purchasePriceBRL directCostsBRL')
    .lean();

  const stats = { scanned: 0, skippedHasOps: 0, backfilled: 0, fieldsUpdated: 0, errors: 0 };

  for (const row of bookings) {
    stats.scanned += 1;
    const bookingId = row._id;

    const fieldUpdates = {};
    if (!row.passengerName && row.passengers?.[0]?.fullName) {
      fieldUpdates.passengerName = row.passengers[0].fullName;
    }
    if (row.agent && row.saleType !== 'agent') {
      fieldUpdates.saleType = 'agent';
    }
    if (Object.keys(fieldUpdates).length) {
      if (!dryRun) {
        await Booking.updateOne({ _id: bookingId }, { $set: fieldUpdates });
      }
      stats.fieldsUpdated += 1;
    }

    const opCount = await BookingOperation.countDocuments({ booking: bookingId });
    if (opCount > 0) {
      stats.skippedHasOps += 1;
      continue;
    }

    if (dryRun) {
      stats.backfilled += 1;
      continue;
    }

    try {
      const booking = await Booking.findById(bookingId);
      const actor = userId || row.rrvProcessedBy || undefined;
      await recordIssueOperation(booking, actor);

      if (booking.status === 'voided' || booking.bookingType === 'void') {
        await recordVoidOperation(booking, booking.rrvNote, actor);
      } else if (booking.status === 'refunded' || booking.bookingType === 'refund') {
        await recordRefundOperation(booking, {
          penalty: booking.rrvPenalty || 0,
          refundAmount: booking.rrvRefundAmount || 0,
          reason: booking.rrvNote,
        }, actor);
      } else if (booking.status === 'reissued' || booking.bookingType === 'reissue') {
        const child = await Booking.findOne({ parentBooking: bookingId }).sort({ createdAt: 1 });
        if (child) {
          await recordReissueOperation(booking, child, booking.rrvNote, actor);
        }
      }

      stats.backfilled += 1;
    } catch (err) {
      stats.errors += 1;
      console.error(`[backfill] ${row.bookingNumber}:`, err.message);
    }
  }

  return stats;
}

export async function listBookingOperations(bookingId) {
  const booking = await Booking.findById(bookingId).lean();
  if (!booking) throw ApiError.notFound('Booking not found');

  const [stored, childBookings] = await Promise.all([
    BookingOperation.find({ booking: bookingId })
      .sort({ operationDate: 1, createdAt: 1 })
      .populate('legacyChildBooking', 'bookingNumber')
      .populate('createdBy', 'name')
      .lean(),
    Booking.find({ parentBooking: bookingId }).select('bookingNumber ticketNumber createdAt').lean(),
  ]);

  if (stored.length) {
    return {
      bookingNumber: booking.bookingNumber,
      items: stored.map((doc) => formatOperation(doc)),
    };
  }

  return {
    bookingNumber: booking.bookingNumber,
    items: buildLegacyOperations(booking, childBookings),
  };
}

export async function recordIssueOperation(booking, userId) {
  const rate = booking.bdtRateAtBooking ?? booking.exchangeRateAtBooking ?? 1;
  return recordBookingOperation({
    bookingId: booking._id,
    operationType: 'ISSUE',
    operationDate: booking.createdAt || new Date(),
    newTicketNumber: booking.ticketNumber || '',
    supplierAdjustmentBRL: brlFromBooking(booking, 'purchase'),
    saleAdjustmentBRL: brlFromBooking(booking, 'sale'),
    receivedAdjustmentBRL: bdtToBrl(booking.amountPaid || 0, rate),
    payableAdjustmentBRL: bdtToBrl(booking.supplierPaid || 0, rate),
    exchangeRateBrlToBdt: rate,
    remarks: 'Booking created',
    status: 'completed',
    financialApplied: true,
    userId,
  });
}

export async function recordVoidOperation(booking, reason, userId) {
  const rate = booking.bdtRateAtBooking ?? booking.exchangeRateAtBooking ?? 1;
  return recordBookingOperation({
    bookingId: booking._id,
    operationType: 'VOID',
    oldTicketNumber: booking.ticketNumber || '',
    exchangeRateBrlToBdt: rate,
    remarks: reason || 'Booking voided',
    status: 'completed',
    userId,
  });
}

export async function recordRefundOperation(booking, { penalty, refundAmount, reason }, userId) {
  const rate = booking.bdtRateAtBooking ?? booking.exchangeRateAtBooking ?? 1;
  const pending = await BookingOperation.findOne({ booking: booking._id, operationType: 'REFUND', status: 'pending' });
  if (pending) {
    pending.status = 'completed';
    pending.penaltyBRL = bdtToBrl(penalty, rate);
    pending.refundAmountBRL = bdtToBrl(refundAmount, rate);
    pending.remarks = reason || pending.remarks;
    pending.financialApplied = true;
    pending.operationDate = new Date();
    await pending.save();
    return formatOperation(pending.toObject());
  }
  return recordBookingOperation({
    bookingId: booking._id,
    operationType: 'REFUND',
    oldTicketNumber: booking.ticketNumber || '',
    penaltyBRL: bdtToBrl(penalty, rate),
    refundAmountBRL: bdtToBrl(refundAmount, rate),
    exchangeRateBrlToBdt: rate,
    remarks: reason || `Refund processed`,
    status: 'completed',
    userId,
  });
}

export async function recordRefundRequestOperation(booking, { penalty, reason }, userId) {
  if (await pendingRefundExists(booking._id)) {
    throw ApiError.badRequest('A refund request is already pending for this booking');
  }
  const rate = booking.bdtRateAtBooking ?? booking.exchangeRateAtBooking ?? 1;
  return recordBookingOperation({
    bookingId: booking._id,
    operationType: 'REFUND',
    oldTicketNumber: booking.ticketNumber || '',
    penaltyBRL: bdtToBrl(penalty, rate),
    exchangeRateBrlToBdt: rate,
    remarks: reason || 'Refund requested',
    status: 'pending',
    financialApplied: false,
    userId,
  });
}

export async function recordReissueOperation(original, newBooking, reason, userId) {
  const rate = original.bdtRateAtBooking ?? original.exchangeRateAtBooking ?? 1;
  return recordBookingOperation({
    bookingId: original._id,
    operationType: 'REISSUE',
    oldTicketNumber: original.ticketNumber || '',
    newTicketNumber: newBooking.ticketNumber || '',
    legacyChildBooking: newBooking._id || newBooking.id,
    exchangeRateBrlToBdt: rate,
    remarks: reason || `Reissued as ${newBooking.bookingNumber}`,
    status: 'completed',
    userId,
  });
}

export default {
  listBookingOperations,
  recordBookingOperation,
  recordIssueOperation,
  recordVoidOperation,
  recordRefundOperation,
  recordRefundRequestOperation,
  recordReissueOperation,
  backfillBookingOperations,
};

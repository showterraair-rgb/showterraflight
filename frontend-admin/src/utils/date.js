import dayjs from 'dayjs';

export function formatDate(value) {
  if (!value) return '—';
  return dayjs(value).format('DD MMM YYYY');
}

export function formatDateTime(value) {
  if (!value) return '—';
  return dayjs(value).format('DD MMM YYYY, h:mm A');
}

export default formatDate;

const IP_SERVICES = [
  'https://api.ipify.org?format=text',
  'https://ifconfig.me/ip',
];

function isIpv4(value) {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(String(value || '').trim());
}

/** Detect this server's public outbound IPv4 (what external APIs see). */
export async function getServerOutboundIp() {
  for (const url of IP_SERVICES) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) continue;
      const ip = (await res.text()).trim();
      if (isIpv4(ip)) {
        return { success: true, ip };
      }
    } catch {
      // try next service
    } finally {
      clearTimeout(timer);
    }
  }
  return { success: false, error: 'Could not detect server outbound IP' };
}

export function extractIpFromBulkSmsBdError(message) {
  const match = String(message || '').match(/ip\s+([0-9]{1,3}(?:\.[0-9]{1,3}){3})/i);
  return match?.[1] || '';
}

export default { getServerOutboundIp, extractIpFromBulkSmsBdError };

/** Attach a MongoDB session to a query when transactions are active. */
export function withSession(query, session) {
  return session ? query.session(session) : query;
}

/** Mongoose create/save options for optional sessions. */
export function sessionOptions(session) {
  return session ? { session } : undefined;
}

export function isTransactionNotSupported(err) {
  const message = err?.message || '';
  return (
    err?.code === 20
    || /Transaction numbers are only allowed/i.test(message)
    || /replica set member or mongos/i.test(message)
  );
}

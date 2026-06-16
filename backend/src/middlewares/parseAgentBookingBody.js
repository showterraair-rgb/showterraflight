/** Parse JSON fields from multipart agent booking form */
export function parseAgentBookingBody(req, _res, next) {
  if (typeof req.body.passengers === 'string') {
    try {
      req.body.passengers = JSON.parse(req.body.passengers);
    } catch {
      req.body.passengers = [];
    }
  }
  if (req.body.ticketIssued !== undefined) {
    req.body.ticketIssued = req.body.ticketIssued === 'true' || req.body.ticketIssued === true;
  }
  next();
}

export default parseAgentBookingBody;

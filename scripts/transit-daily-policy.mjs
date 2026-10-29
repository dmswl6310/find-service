export function quotaDay(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit"}).format(date);
}

export function dailyAllowance(evidence, now = new Date(), otherReserved = 0) {
  const at = new Date(evidence?.confirmedAt);
  if (!evidence?.source || !Number.isInteger(evidence.used) || !Number.isInteger(evidence.limit) || evidence.limit < 1 || evidence.used < 0 || evidence.used > evidence.limit || !Number.isInteger(otherReserved) || otherReserved < 0) throw new Error("Invalid quota evidence");
  const age = now.getTime() - at.getTime();
  if (!Number.isFinite(age) || age < 0 || age > 60 * 60 * 1000 || quotaDay(at) !== quotaDay(now)) throw new Error("Usage evidence must be current, same KST day and at most one hour old");
  return Math.max(0, Math.min(30, evidence.limit - evidence.used - otherReserved));
}

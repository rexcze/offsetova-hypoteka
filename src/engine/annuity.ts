/** Monthly annuity payment for `principal` repaid over `months` at `annualRate` p. a. */
export function annuity(principal: number, annualRate: number, months: number): number {
  if (principal <= 0 || months <= 0) return 0
  const i = annualRate / 12
  if (i === 0) return principal / months
  return (principal * i) / (1 - (1 + i) ** -months)
}

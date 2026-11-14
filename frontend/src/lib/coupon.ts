/**
 * The short code printed under a QR coupon, for when the camera cannot be used.
 * It is the first eight characters of the coupon code, shown as "A1B2 C3D4".
 */
export function shortCode(couponCode: string): string {
  const code = couponCode.slice(0, 8).toUpperCase();
  return `${code.slice(0, 4)} ${code.slice(4)}`;
}

/**
 * The platform's cut, shown plainly at checkout. A placeholder until the
 * business model is decided: 2% of the price, at least ₹5, nothing on free.
 * Change it here and every checkout follows.
 */
export const FEE_RATE = 0.02;
export const FEE_MIN = 5;

export const feeOn = (price: number) => (price > 0 ? Math.max(FEE_MIN, Math.round(price * FEE_RATE)) : 0);
export const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

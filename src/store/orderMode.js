/**
 * Delivery vs. pickup, chosen in the header and honoured at checkout.
 *
 * The choice used to exist only inside the checkout form, which meant the
 * shopper could not see — let alone change — it while browsing, and the
 * delivery fee appeared as a surprise on the last screen. Keeping it in one
 * place lets the header show it and the checkout start from it.
 */
const KEY = "orderMode";

export const DELIVERY = "delivery";
export const PICKUP = "pickup";

export function getOrderMode() {
  return window.localStorage.getItem(KEY) === PICKUP ? PICKUP : DELIVERY;
}

export function setOrderMode(mode) {
  window.localStorage.setItem(KEY, mode === PICKUP ? PICKUP : DELIVERY);
}

/** Checkout models this as a boolean, so hand it one. */
export function prefersDelivery() {
  return getOrderMode() === DELIVERY;
}

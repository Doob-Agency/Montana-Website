import { createSlice } from "@reduxjs/toolkit";

/**
 * Payment gateways the customer may actually pay with.
 *
 * The backend owns this: /getPaymentGateways returns the gateways switched on in
 * System Settings. Checkout used to ignore it and hardcode "myfatoorah", so
 * turning MyFatoorah off and Moyasar on in the dashboard changed nothing on the
 * site — the order still went out as MyFatoorah.
 *
 * Names come back exactly as the order endpoint expects them ("COD",
 * "myfatoorah", "moyasar"), so a gateway's name is its payment method.
 */
const Store = {
    name: "gateways",
    initialState: { loaded: false, list: [] },
  },
  reducers = (Store.reducers = {});

// The endpoint returns every gateway with its flag, not only the enabled ones,
// so the flag has to be honoured here — otherwise checkout offers all twelve.
// The flag arrives as 1/0 from MySQL, but tolerate "1"/true too.
function enabled(flag) {
  return flag === 1 || flag === "1" || flag === true;
}

reducers.init = function (state, action) {
  state.loaded = true;
  state.list = Array.isArray(action.payload)
    ? action.payload.filter((g) => g && g.name && enabled(g.is_active))
    : [];
};

export default createSlice(Store).reducer;

import { createSlice } from "@reduxjs/toolkit";

const customCSS = document.createElement("style"),
  Store = {
    name: "settings",
    initialState: { loaded: false, failed: false, data: null },
  },
  reducers = (Store.reducers = {});

document.head.appendChild(customCSS);

reducers.init = function (state, action) {
  const obj = {};
  state.loaded = true;
  state.failed = false;
  action.payload.forEach(({ key, value }) => (obj[key] = value));
  customCSS.textContent = obj.customCSS;
  state.data = obj;
};

/**
 * The whole app is gated on settings being loaded, so when this request failed
 * the site rendered a permanently blank page with nothing to explain it. This
 * lets the shell say so and offer a retry.
 */
reducers.failed = function (state) {
  state.failed = true;
};

export default createSlice(Store).reducer;

import { createSlice } from "@reduxjs/toolkit";

const customCSS = document.createElement("style"),
  Store = {
    name: "settings",
    initialState: { loaded: false, data: null, gateways: {} },
  },
  reducers = (Store.reducers = {});

document.head.appendChild(customCSS);

reducers.init = function (state, action) {
  const obj = {};
  state.loaded = true;
  action.payload.forEach(({ key, value }) => (obj[key] = value));
  customCSS.textContent = obj.customCSS;
  // console.log(obj);
  state.data = obj;
};

reducers.initGateways = function (state, action) {
  const obj = {};
  action.payload.forEach(({ name, is_active }) => (obj[name] = !!is_active));
  state.gateways = obj;
};

export default createSlice(Store).reducer;

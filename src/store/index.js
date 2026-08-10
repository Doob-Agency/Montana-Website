/* eslint-disable no-unused-vars */
import { configureStore } from "@reduxjs/toolkit";
import Products from "./products.js";
import User from "./user.js";
import Restaurant from "./restaurant.js";
import Sliders from "./sliders.js";
import gateways from "./gateways.js";
import settings from "./settings.js";

const cartMsg =
    "لا يمكن اضافة الطلب المخصص الى العربة بجانب الطلبات الأخرى، هل تريد إخلاء العربة؟",
  APP_STATE = configureStore({
    reducer: { Products, User, Restaurant, Sliders, settings, gateways },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(cartValidation), // Add custom middleware here
  });
export default APP_STATE;

function cartValidation(store) {
  return (next) => (action) => {
    if (action.type === "products/addToCart") {
      const state = store.getState().Products,
        cart = state.cart,
        payload = action.payload;

      const isSpecialItem = payload.category_id > 7,
        clearCart =
          cart.length &&
          ((isSpecialItem && !state.is_special) ||
            (!isSpecialItem && state.is_special));

      if (!clearCart) return next(action);

      window.modalOptions.open(cartMsg, function (proceedToClear) {
        if (!proceedToClear) return;
        APP_STATE.dispatch({ type: "products/clearCart" });
        APP_STATE.dispatch(action);
      });

      return store.getState();
    } else return next(action);
  };
}

/**
 * Every call to the dashboard goes through here.
 *
 * These requests used to be bare `fetch().then().then(dispatch)` chains with no
 * catch, so a dropped connection, a blocked request or an HTML error page threw
 * an unhandled rejection — which in development covers the whole site with the
 * red overlay, and in production silently leaves that slice of state empty with
 * no clue why. Nothing here can reject: on failure it resolves to null, the
 * caller skips its dispatch, and the reason is logged once.
 */
export function apiFetch(url, options) {
  return fetch(url, options)
    .then((res) => {
      if (!res.ok) {
        console.warn(`[api] ${res.status} ${res.statusText} — ${url}`);
        return null;
      }
      // A session that has expired often answers with an HTML login page, and
      // res.json() on HTML throws "Unexpected token '<'".
      return res.json().catch(() => {
        console.warn(`[api] response was not JSON — ${url}`);
        return null;
      });
    })
    .catch((err) => {
      console.warn(`[api] request failed — ${url}`, err.message);
      return null;
    });
}

apiFetch(process.env.REACT_APP_API_URL + "/public/api/getItemcategories").then(
  (r) =>
    r &&
    APP_STATE.dispatch({
      type: "products/initMiniCategories",
      payload: r,
    }),
);

navigator.geolocation.getCurrentPosition((POS) => {
  if (!("geolocation" in navigator))
    return window.modalOptions.open(
      "Geolocation is not supported by your browser."
    );

  const coords = {
    latitude: "" + POS.coords.latitude,
    longitude: "" + POS.coords.longitude,
  };

  APP_STATE.dispatch({ type: "user/setLoc", payload: coords });
}, console.error);

const baseUrl = process.env.REACT_APP_API_URL + "/public/api",
  fetchOpts = {
    method: "POST",
    get headers() {
      const obj = { "Content-Type": "application/json" },
        token = window.localStorage.getItem("token");
      token && (obj["Authorization"] = token);
      return obj;
    },
  };

apiFetch(baseUrl + "/get-settings", { method: "POST" }).then((r) =>
  APP_STATE.dispatch(
    Array.isArray(r)
      ? { type: "settings/init", payload: r }
      : { type: "settings/failed" },
  ),
);

apiFetch(baseUrl + "/get-all-restaurant", fetchOpts).then(
  (data) =>
    data && APP_STATE.dispatch({ type: "restaurant/INIT_BRANCHES", payload: data }),
);

apiFetch(baseUrl + "/getSliders").then(
  (r) => r && APP_STATE.dispatch({ type: "sliders/init", payload: r }),
);

apiFetch(baseUrl + "/getPaymentGateways").then((r) =>
  APP_STATE.dispatch({ type: "gateways/init", payload: r || [] }),
);

const savedSlug = window.localStorage.getItem("slug");

export const updateUserInfo = function () {
    apiFetch(baseUrl + "/update-user-info", fetchOpts).then((r) => {
      // A dead session answers without a data object; reading r.data off null
      // used to throw and take the page down on load.
      if (r && r.data) APP_STATE.dispatch({ type: "user/init", payload: r.data });
      getFavourites();
      getUserAlerts();
    });
  },
  logout = function () {
    APP_STATE.dispatch({ type: "products/clearCart" });
    APP_STATE.dispatch({ type: "user/logout" });
  },
  getFavourites = function () {
    if (fetchOpts.headers.Authorization === undefined) return;

    apiFetch(baseUrl + "/get-favorite-items", fetchOpts).then(
      (res) =>
        Array.isArray(res) &&
        APP_STATE.dispatch({ type: "products/initFavourites", payload: res }),
    );
  },
  getUserAlerts = function () {
    apiFetch(baseUrl + "/get-user-notifications", fetchOpts).then(
      (r) =>
        r &&
        r.length &&
        APP_STATE.dispatch({ type: "user/setAlerts", payload: r }),
    );

    apiFetch(baseUrl + "/get-addresses", fetchOpts).then((r) => {
      if (!r) return;
      APP_STATE.dispatch({ type: "user/setAddresses", payload: r });
      APP_STATE.dispatch({ type: "user/setActiveAddress" });
    });

    apiFetch(baseUrl + "/cash-back", fetchOpts).then((res) => {
      const rows = res && res.data;
      if (!Array.isArray(rows)) return;

      const cashback = rows.find((c) => c.title === "cart");
      cashback &&
        cashback.is_active &&
        APP_STATE.dispatch({ type: "products/setCashback", payload: cashback });
    });

    apiFetch(baseUrl + "/get-orders", fetchOpts).then(
      (r) =>
        r && APP_STATE.dispatch({ type: "user/setPrevOrders", payload: r }),
    );
  };

if (window.localStorage.getItem("token")) updateUserInfo();

if (savedSlug) {
  apiFetch(baseUrl + "/get-restaurant-info/" + savedSlug, fetchOpts).then(
    (resData) => {
      // A failed request is not proof the branch is gone. Reloading on a null
      // response would have looped the page on any network blip, because the
      // reload issues the same request again.
      if (!resData) return;

      if (!resData.is_active) {
        window.localStorage.removeItem("slug");
        window.location.reload();
        return;
      }

      APP_STATE.dispatch({ type: "restaurant/init", payload: resData });

      apiFetch(baseUrl + "/get-restaurant-items/" + savedSlug, fetchOpts).then(
        (data) =>
          data && APP_STATE.dispatch({ type: "products/init", payload: data }),
      );
    },
  );
}

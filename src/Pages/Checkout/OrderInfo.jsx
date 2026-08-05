import { useLayoutEffect, useState } from "react";
import { useSelector, useStore } from "react-redux";
import { calcCashback } from "../Cart";
import { _useCoupon } from "../Cart";
import getPage from "../../translation";
import CurrencySymbol from "../../CurrencySymbol";

// Gateway rows come from the database by name; these are just what the customer
// sees. Anything without an entry falls back to the raw name rather than vanishing.
const GATEWAY_LABELS = {
  myfatoorah: { ar: "ماي فاتورة", en: "MyFatoorah" },
  moyasar: { ar: "ميسر", en: "Moyasar" },
};

const getText = getPage("checkout"),
  days = [/^sun/i, /^mon/i, /^tue/i, /^wed/i, /^thu/i, /^fri/i, /^sat/i],
  isArabic = window.localStorage.getItem("lang") === "العربية",
  nameTarget = isArabic ? "name_ar" : "name",
  emptyStr = "";

export default function (props) {
  const {
      reqBody,
      placeOrder,
      cartItems,
      deliveryState,
      clues,
      resId,
      payment,
    } = props,
    { userAddresses, isExceptionalCart, cashback } = clues;

  const store = useStore().getState(),
    settings = store.settings.data,
    currRes = store.Restaurant.data,
    freeDeliverySubtotal = currRes.free_delivery_subtotal,
    wallet_balance = store.User.data.wallet_balance,
    [delivery] = deliveryState,
    [paymentMethod, setPaymentMethod] = payment,
    [discountAmount, setDiscount] = useState(0);

  let totalPrice = 0;

  const coupon = window.localStorage.getItem("coupon"),
    order = cartItems.map((CI) => {
      totalPrice += +CI.price * CI.quantity;
      CI.customProps && Object.assign(reqBody, CI.customProps);
      return extractData(CI, resId);
    });

  useLayoutEffect(
    function () {
      if (coupon) {
        setDiscount(false);
        const token = window.localStorage.getItem("token"),
          couponParams = {
            coupon,
            restaurant_id: "" + currRes.id,
            subtotal: "" + (subTotal - wallet_balance),
          };
        _useCoupon(couponParams, token, applyCoupon, rejectCoupon);
      }
    },
    [coupon, delivery],
  );

  const subTotal = totalPrice,
    cashbackAmount = +calcCashback(totalPrice, cashback, settings),
    calcSubtotalDelivery =
      freeDeliverySubtotal > 0 && totalPrice >= freeDeliverySubtotal
        ? 0
        : clues.deliveryCharges,
    delivery_charges = delivery ? +calcSubtotalDelivery : 0;

  reqBody.order = order;
  reqBody.method = paymentMethod;
  reqBody.cashback = cashbackAmount;
  coupon && (reqBody.coupon.code = coupon);

  clues.discount = 0;
  discountAmount &&
    (clues.discount += Math.min(subTotal, Math.abs(discountAmount)));

  // The wallet only ever covers what is left to pay — the backend deducts
  // min(balance, total). Adding the whole balance showed the customer their
  // entire balance as though it were a discount on this order.
  clues.discount += Math.min(
    wallet_balance,
    Math.max(0, subTotal - clues.discount),
  );

  const deliveryTargetOption = delivery ? "enCODonDelivery" : "enCODonSF";
  totalPrice = Math.max(0, totalPrice - clues.discount);

  const taxIncluded = settings.enpriceincludestax === "true",
    taxes =
      settings.taxApplicable === "true"
        ? calcTaxes(totalPrice, +settings.taxPercentage, taxIncluded)
        : 0,
    // Tax that is already inside the price must not be added on top here either,
    // or the "before discount" figure invents a discount that never existed.
    totalBeforeDiscount =
      subTotal + delivery_charges + (taxIncluded ? 0 : taxes);

  totalPrice += delivery_charges + (taxIncluded ? 0 : taxes);
  if (totalPrice === 0) reqBody.method = "COD";

  // Which gateways the customer may pay with is System Settings' call alone.
  // Checkout used to hardcode "myfatoorah", so switching gateways in the
  // dashboard changed nothing here.
  const activeGateways = useSelector((e) => e.gateways).list,
    codAllowed = !isExceptionalCart && settings[deliveryTargetOption] === "true",
    payMethods = activeGateways
      .filter((g) => (isCOD(g.name) ? codAllowed : true))
      .map((g) => ({
        value: g.name,
        label: isCOD(g.name)
          ? getText(30)
          : (GATEWAY_LABELS[g.name] || {})[isArabic ? "ar" : "en"] || g.name,
      })),
    methodKey = payMethods.map((m) => m.value).join("|");

  // Settings load after the first render, and delivery/pickup change whether COD
  // is offered — either can leave a method selected that is no longer on offer.
  useLayoutEffect(() => {
    if (!payMethods.length) return;
    if (!payMethods.some((m) => m.value === paymentMethod))
      setPaymentMethod(payMethods[0].value);
  }, [methodKey, paymentMethod]);

  return (
    <div className="p-3" style={{ color: "var(--midgray)" }}>
      <h5 className="title m-0 text-center d-block">{getText(18)}</h5>

      <hr />
      <ul className="list-unstyled m-0 p-0">{order.map(productItem)}</ul>
      <hr />
      <div>
        {getText(19)}
        <span style={{ color: "var(--primary)", fontWeight: "600" }}>
          {(subTotal - (taxIncluded ? taxes : 0)).toFixed(2)}{" "}
          <CurrencySymbol />
        </span>
      </div>

      <div>
        {getText(26)}
        <span>
          {wallet_balance + " "} <CurrencySymbol />
        </span>
      </div>

      <div style={{ color: "var(--sec)" }}>
        {getText(21)}
        <span style={{ color: "inherit" }}>
          {discountAmount === false ? (
            getText(22)
          ) : (
            <>
              {-Math.abs(discountAmount)}
              <CurrencySymbol />
            </>
          )}
        </span>
      </div>

      <hr />
      <div>
        <span>
          {getText(23)}{" "}
          {delivery && delivery_charges === 0 && (
            <sub
              className="px-2"
              style={{
                background: "#ffc933",
                color: "#fff",
                borderRadius: "14px",
              }}
            >
              {getText(24)}
            </sub>
          )}
        </span>

        <span>
          {delivery_charges} <CurrencySymbol />
        </span>
      </div>

      {settings.taxApplicable === "true" && (
        <div>
          {getText(25)}({settings.taxPercentage}%)
          <span>
            {Math.abs(taxes).toLocaleString("en-US")} <CurrencySymbol />
          </span>
        </div>
      )}

      <hr />

      <div
        className="total h5"
        style={{ color: "var(--primary)", fontWeight: "bold" }}
      >
        {getText(27)}

        {totalBeforeDiscount > totalPrice && (
          <sub
            style={{
              color: "var(--midgray)",
              marginInlineStart: "auto",
              marginInlineEnd: "6px",
            }}
          >
            <del className="align-items-center d-flexs">
              {totalBeforeDiscount.toLocaleString("en-US")} <CurrencySymbol />
            </del>
          </sub>
        )}
        <span>
          {totalPrice.toLocaleString("en-US")} <CurrencySymbol />
        </span>
      </div>

      {/* {totalPrice > 0 && ( */}
      <form style={{ color: "var(--black)" }}>
        <span
          className="d-block h5 text-center"
          style={{ color: "var(--primary)" }}
        >
          {getText(28)}
        </span>

        {payMethods.length ? (
          payMethods.map((m) => (
            <label className="d-flex gap-2 mb-3" key={m.value}>
              <input
                type="radio"
                name="payment"
                onChange={() => setPaymentMethod(m.value)}
                checked={paymentMethod === m.value}
              />
              {m.label}
            </label>
          ))
        ) : (
          <p className="text-center m-0" style={{ color: "var(--sec)" }}>
            {isArabic
              ? "لا توجد طريقة دفع مفعّلة حالياً"
              : "No payment method is currently enabled"}
          </p>
        )}
      </form>
      {/* )} */}

      {(!delivery || userAddresses.length > 0) && (
        <>
          {isWithinWorkingHours(currRes) ? (
            <button
              type="button"
              onClick={placeOrder}
              disabled={!paymentMethod}
              className="btn mt-4 mx-auto w-100"
            >
              {getText(31)}
            </button>
          ) : (
            <>
              <button className="btn w-100" disabled={true}>
                {getText(14)}
              </button>

              <span className="small d-block text-center text-danger mt-3">
                {getText(15)}
              </span>
            </>
          )}
        </>
      )}
    </div>
  );

  function applyCoupon(res) {
    const { discount_type, discount } = res,
      value =
        discount_type === "PERCENTAGE"
          ? ((subTotal - wallet_balance) / 100) * +discount
          : +discount;

    setDiscount(-Math.floor(value));
  }

  function rejectCoupon() {
    setDiscount(0);
    window.localStorage.removeItem("coupon");
  }
}

function productItem(item) {
  const { id, quantity, price, name } = item;
  return (
    <li
      key={id}
      className="align-items-center d-flex gap-3 justify-content-between"
      style={{
        "font-size": "small",
        "font-weight": 600,
      }}
    >
      <span
        className="align-items-center d-flex flex-grow-1 gap-2"
        style={{ color: "var(--primary)" }}
      >
        <img
          src={process.env.REACT_APP_API_URL + item.img}
          alt="thumbnail"
          style={{ height: "32px", width: "32px", borderRadius: "4px" }}
        />
        {item[nameTarget] || name}
      </span>
      <span>x {quantity}</span>
      <span>
        {price} <CurrencySymbol />
      </span>
    </li>
  );
}

function extractData(i, restaurant_id) {
  const { id, name, price } = i;

  return {
    name: i[nameTarget] || name,
    restaurant_id: +restaurant_id,
    img: i.img,
    id: emptyStr + id,
    price: emptyStr + price,
    quantity: emptyStr + i.quantity,
    selectedaddons: i.addons.map((a) => ({ ...a, price: emptyStr + a.price })),
  };
}

function isCOD(name) {
  return String(name).toUpperCase() === "COD";
}

function calcTaxes(price, percentage, taxIncluded) {
  // When the price already includes the tax, the tax is a share OF the price,
  // not an addition TO it: 285 at 15% carries 37.17 of tax, not 42.75. Adding
  // instead of extracting is what made the site disagree with the dashboard.
  return taxIncluded
    ? (percentage / (100 + percentage)) * price
    : (percentage / 100) * price;
}

function isWithinWorkingHours({ schedule_data, is_schedulable }) {
  if (is_schedulable) {
    const currTime = new Date(
        new Date().toLocaleString("en-SA", { timeZone: "Asia/Riyadh" }),
      ),
      day = days[currTime.getDay()];

    const workingHours = JSON.parse(schedule_data),
      targetDay = Object.keys(workingHours).find((d) => day.test(d));

    if (targetDay) {
      const time = currTime.getTime();

      return workingHours[targetDay].some((resData) => {
        const openingTime = resData.open.split(/\D/),
          closingTime = resData.close.split(/\D/);

        const validStart = currTime.setHours(openingTime[0], openingTime[1]),
          validEnd = currTime.setHours(closingTime[0], closingTime[1]);

        return time === Math.min(Math.max(time, validStart), validEnd);
      });
    }
  }

  return true;
}

import { useLayoutEffect, useState } from "react";
import { useStore } from "react-redux";
import { calcCashback } from "../Cart";
import { _useCoupon } from "../Cart";
import getPage from "../../translation";
import CurrencySymbol from "../../CurrencySymbol";

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
    gateways = store.settings.gateways,
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

  clues.discount += wallet_balance;

  const deliveryTargetOption = delivery ? "enCODonDelivery" : "enCODonSF";
  totalPrice = Math.max(0, totalPrice - clues.discount);

  const taxes =
      settings.taxApplicable === "true"
        ? calcTaxes(totalPrice, +settings.taxPercentage, settings.enpriceincludestax === "true")
        : 0,
    totalBeforeDiscount = subTotal + delivery_charges + (settings.enpriceincludestax === "true" ? 0 : taxes);

  totalPrice +=
    delivery_charges + (settings.enpriceincludestax === "true" ? 0 : taxes);
  if (totalPrice === 0) reqBody.method = "COD";

  return (
    <div className="p-3" style={{ color: "var(--midgray)" }}>
      <h5 className="title m-0 text-center d-block">{getText(18)}</h5>

      <hr />
      <ul className="list-unstyled m-0 p-0">{order.map(productItem)}</ul>
      <hr />
      <div>
        {getText(19)}
        <span style={{ color: "var(--primary)", fontWeight: "600" }}>
          {(subTotal + (settings.enpriceincludestax === "true" ? -taxes : 0)).toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}{" "}
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
            {Math.abs(taxes).toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} <CurrencySymbol />
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

      <div className="payment-methods">
        <span className="payment-methods__title">{getText(28)}</span>

        {gateways.myfatoorah && (
          <div
            className={"payment-method-item" + (paymentMethod === "myfatoorah" ? " selected" : "")}
            onClick={() => setPaymentMethod("myfatoorah")}
          >
            <span className="payment-method-item__radio">
              {paymentMethod === "myfatoorah" && <span className="payment-method-item__dot" />}
            </span>
            <div className="payment-method-item__body">
              <span className="payment-method-item__name">
                MyFatoorah
                {settings.myFatooraMode === "test" && <span className="payment-method-item__test-badge">TEST</span>}
              </span>
              <div className="payment-method-item__tags">
                <span>Visa</span><span>Mastercard</span><span>Apple Pay</span><span>STC Pay</span>
              </div>
            </div>
            <span className="payment-method-item__logo mf-logo">MF</span>
          </div>
        )}

        {gateways.moyasar && (
          <div
            className={"payment-method-item" + (paymentMethod === "moyasar" ? " selected" : "")}
            onClick={() => setPaymentMethod("moyasar")}
          >
            <span className="payment-method-item__radio">
              {paymentMethod === "moyasar" && <span className="payment-method-item__dot" />}
            </span>
            <div className="payment-method-item__body">
              <span className="payment-method-item__name">
                Moyasar
                {settings.moyasarMode === "test" && <span className="payment-method-item__test-badge">TEST</span>}
              </span>
              <div className="payment-method-item__tags">
                <span>Visa</span><span>Mada</span><span>Apple Pay</span><span>STC Pay</span>
              </div>
            </div>
            <span className="payment-method-item__logo ms-logo">MS</span>
          </div>
        )}

        {gateways.COD && (isExceptionalCart || settings[deliveryTargetOption] === "true") && (
          <div
            className={"payment-method-item" + (paymentMethod === "COD" ? " selected" : "")}
            onClick={() => setPaymentMethod("COD")}
          >
            <span className="payment-method-item__radio">
              {paymentMethod === "COD" && <span className="payment-method-item__dot" />}
            </span>
            <div className="payment-method-item__body">
              <span className="payment-method-item__name">{getText(30)}</span>
              <div className="payment-method-item__tags">
                <span>الدفع عند الاستلام</span>
              </div>
            </div>
            <span className="payment-method-item__logo cod-logo">💵</span>
          </div>
        )}
      </div>

      {(!delivery || userAddresses.length > 0) && (
        <>
          {isWithinWorkingHours(currRes) ? (
            <button
              type="button"
              onClick={placeOrder}
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

function calcTaxes(price, percentage, taxIncluded) {
  return taxIncluded
    ? price - price / (1 + percentage / 100)
    : (percentage / 100) * price;
}

function isWithinWorkingHours({ schedule_data, is_schedulable }) {
  try {
    if (is_schedulable) {
      const currTime = new Date(
          new Date().toLocaleString("en-US", { timeZone: "Asia/Riyadh" }),
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
  } catch (e) {}

  return true;
}

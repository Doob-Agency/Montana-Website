import getPage from "../translation";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useRef, useState } from "react";
import { useLocation, useParams, useSearchParams } from "react-router-dom";

let errMsg = "";

function isArabic() {
  return window.localStorage.getItem("lang") === "العربية";
}

// The invoice used to print whatever the method key happened to be — an order
// the wallet covered in full showed "moyasar", a gateway it never reached.
export function paymentLabel(order) {
  const key = String((order && order.payment_mode) || "").toLowerCase();

  if (
    key === "wallet" ||
    (order && +order.pay_from_wallet > 0 && +order.total <= 0)
  )
    return isArabic() ? "مدفوع من المحفظة" : "Paid from wallet";

  if (key === "cod") return isArabic() ? "عند الاستلام" : "Cash on delivery";

  return isArabic() ? "مدفوع" : "Paid";
}

const getText = getPage("invoice");

export default () => {
  const params = useParams(),
    [query] = useSearchParams(),
    LOC = useLocation(),
    { prevOrders, data: userData } = useSelector((e) => e.User),
    dispatch = useDispatch(),
    [state, setState] = useState(LOC.state === undefined ? null : LOC.state),
    // The effect re-runs whenever the order list arrives, and `state` is still
    // null while the first request is in flight — so the payment was confirmed
    // two or three times per visit. Each confirmation re-ran the whole
    // post-payment routine on the server.
    confirmed = useRef(false);

  const orderId = query.get("orderId");

  useEffect(
    function () {
      if (state !== null) return;

      if (params.id) {
        if (confirmed.current) return;
        confirmed.current = true;
        instantPaymentInvoice();
      } else if (orderId) {
        setState(getOrderData(+orderId, prevOrders));
      }
    },
    [prevOrders],
  );

  if (state === null)
    return (
      <div className="container">
        <div
          className="text-center py-5"
          style={{ color: "var(--midgray)", fontWeight: "400" }}
        >
          <div className="spinner-border mb-3" role="status" />
          <span className="d-block h5">
            {isArabic()
              ? "جارٍ تأكيد الدفع…"
              : "Confirming your payment…"}
          </span>
        </div>
      </div>
    );
  else if (state === false) {
    return (
      <div className="container">
        <div
          className="text-center"
          style={{
            color: "var(--midgray)",
            fontSize: "larger",
            fontWeight: "400",
          }}
        >
          <span className="d-block h3 text-danger">{getText(0)}</span>
          <span className="d-block">
            {isArabic()
              ? "تم استلام الدفع، لكن تعذّر عرض الفاتورة. الطلب مسجّل — يمكنك مراجعته من حسابك."
              : "Your payment went through, but the invoice could not be displayed. The order is saved — you can review it from your account."}
          </span>
          {errMsg && (
            <span
              className="d-block mt-2"
              style={{ fontSize: "0.85rem", opacity: 0.75 }}
            >
              {errMsg}
            </span>
          )}
          <a href="/" className="btn mt-4 d-inline-block">
            {isArabic() ? "العودة للرئيسية" : "Back to home"}
          </a>
        </div>
      </div>
    );
  }

  if (!state || typeof state !== "object") return null;

  if (!orderId) {
    window.localStorage.removeItem("coupon");
    window.localStorage.removeItem("invoiceData");
    dispatch({ type: "products/clearCart" });
  }

  return (
    <section id="invoice" className="container">
      <div
        id="invoice-content"
        className="align-items-center d-flex flex-column gap-2 p-4 text-center"
        style={{
          fontFamily: '"Courier New", monospace',
          fontSize: "0.9rem",
          border: "1px dashed currentcolor",
          color: "var(--primary)",
          borderRadius: "6px",
          width: "fit-content",
          margin: "auto",
        }}
      >
        <img
          src={process.env.PUBLIC_URL + "/assets/home/logo.svg"}
          alt="Montana Logo"
          style={{ maxHeight: "95px" }}
        />

        <span className="mt-3" style={{ fontWeight: "600" }}>
          حلويات مونتانا - {state.restaurant_name}
        </span>
        <p className="d-flex flex-column m-0">
          <span>فاتورة ضريبية مبسطة</span>
          <span>سجل تجاري 4030479174</span>
          <span>الرقم الضريبي 311354802600003</span>
        </p>

        <p
          className="d-flex flex-column gap-2 m-0 my-2 px-5 py-2"
          style={{ border: "2px solid currentColor", width: "fit-content" }}
        >
          الطلب رقم
          <span style={{ fontWeight: "bold" }} dir="ltr">
            #{state.code}
          </span>
        </p>

        <p className="m-0">
          {state.date[1]} {state.date[0]}
        </p>

        <hr className="my-1" style={{ width: "100%", borderStyle: "dashed" }} />

        <ul
          className="list-unstyled m-0 p-0"
          style={{ textAlign: "start", width: "100%" }}
        >
          <li>
            <span style={{ fontWeight: "bold" }}>اسم العميل: </span>
            {userData && userData.name}
          </li>
          <li>
            <span style={{ fontWeight: "bold" }}>رقم الجوال: </span>
            {userData && userData.phone}
          </li>
          <li>
            <span style={{ fontWeight: "bold" }}>العنوان: </span>
            {state.deliveryAddress}
          </li>
        </ul>

        <hr className="my-1" style={{ width: "100%", borderStyle: "dashed" }} />

        <h6
          className="m-0"
          style={{ fontWeight: "600", borderBottom: "1px solid" }}
        >
          الاصناف
        </h6>
        <ul
          className="list-unstyled m-0 p-0 w-100"
          style={{ textAlign: "start" }}
        >
          {state.order.map(ProductItem)}
        </ul>

        <hr className="my-1" style={{ width: "100%", borderStyle: "dashed" }} />

        <p
          className="d-flex justify-content-between m-0 w-100"
          style={{ textAlign: "start" }}
        >
          الخصم
          <span>{(+state.discount || 0).toFixed(2)}</span>
        </p>

        {+state.tax_amount ? (
          <p
            className="d-flex justify-content-between m-0 w-100"
            style={{ textAlign: "start" }}
          >
            الضريبة ({+state.tax || 0}%){" "}
            <span>{(+state.tax_amount).toFixed(2)}</span>
          </p>
        ) : null}

        <p
          className="d-flex justify-content-between m-0 w-100"
          style={{ textAlign: "start" }}
        >
          رسوم التوصيل
          <span>{state.deliveryCharges}</span>
        </p>
        <p
          className="d-flex justify-content-between m-0 w-100"
          style={{ fontWeight: "600" }}
        >
          الاجمالي <span>{state.total}</span>
        </p>

        <hr className="my-1" style={{ width: "100%", borderStyle: "dashed" }} />

        <p className="m-0" style={{ fontWeight: "600" }}>
          طريقة الاستلام: <span>{state.deliveryType}</span>
        </p>

        <p className="m-0" style={{ fontWeight: "600" }}>
          طريقة الدفع: <span>{state.paymentMode}</span>
        </p>

        <hr className="my-1" style={{ width: "100%", borderStyle: "dashed" }} />

        <p className="d-flex flex-column m-0">
          للتواصل مع الطلبات الخاصه أو الشكاوي
          <span style={{ fontWeight: "600" }}>920035416</span>
        </p>

        <img
          style={{ margin: "auto" }}
          src={`https://api.qrserver.com/v1/create-qr-code/?data=${window.location.href}&size=150x150`}
          alt="QR Code"
        ></img>
      </div>

      <button
        className="btn d-block mt-5 mx-auto px-5"
        style={{ background: "var(--primary)", color: "#fff" }}
        onClick={printInvoice}
      >
        طباعة
      </button>

      {/* <pre dir="ltr">{JSON.stringify(state, null, 2)}</pre> */}
    </section>
  );

  function printInvoice() {
    window.print();
  }

  function instantPaymentInvoice() {
    fetch(process.env.REACT_APP_API_URL + "/public/api/payment-callback", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: window.localStorage.getItem("token") || "",
      },
      // Moyasar returns to this page with ?gateway=moyasar&id=<payment id>; the
      // callback endpoint branches on `gateway` and verifies the payment with
      // Moyasar before marking the order paid. MyFatoorah keeps its own shape.
      body: JSON.stringify(
        query.get("gateway") === "moyasar"
          ? {
              isSuccess: true,
              gateway: "moyasar",
              order_id: params.id,
              id: query.get("id"),
            }
          : {
              isSuccess: true,
              order_id: params.id,
              sessionId: query.get("sessionId"),
              paymentId: query.get("paymentId"),
            },
      ),
    })
      .then((r) => r.json())
      .then((res) => {
        if (!res.success) {
          errMsg = res.message;
          return setState(false);
        }

        const data =
          buildInvoice(res.data) || getOrderData(+params.id, prevOrders);

        // Paid, but nothing renderable came back — say so instead of showing a
        // blank page to someone who has just been charged.
        if (!data) {
          errMsg = res.message || "";
          return setState(false);
        }

        setState(data);
      })
      .catch(function (e) {
        errMsg = (e && e.message) || "";
        console.error("invoice:", e);
        setState(false);
      });
  }
};

function ProductItem({ id, name, price, quantity }) {
  let total = 0;
  total += +price * +quantity;

  return (
    <li key={id} className="align-items-center d-flex gap-2">
      <span>{quantity}×</span>
      <span>{name}</span>
      <span style={{ marginInlineStart: "auto" }}>{+price * +quantity}</span>
    </li>
  );
}

function getOrderData(orderId, prevOrders) {
  return buildInvoice(prevOrders.find(({ id }) => id === orderId));
}

// The customer lands here on a fresh page load after the gateway redirects back,
// so the order list is usually still empty or stale — looking the order up in it
// returned null and the page rendered nothing at all. The payment callback
// already answers with the order, so draw from that and keep the list as a
// fallback for the routes that arrive with ?orderId= and no callback.
function buildInvoice(orderData) {
  try {
    return buildInvoiceOrThrow(orderData);
  } catch (e) {
    console.error("invoice: could not build from order", e && e.message);
    return null;
  }
}

function buildInvoiceOrThrow(orderData) {
  if (!orderData || !orderData.orderitems || !orderData.restaurant) return null;

  const isDelivery = orderData.delivery_type === 2,
    result = {};

  result.order = orderData.orderitems.map((item) => ({
    ...item,
    selectedaddons: item.order_item_addons,
  }));

  result.tax = orderData.tax;
  result.restaurant_name = orderData.restaurant.name;
  result.code = orderData.unique_order_id;
  result.deliveryType = isDelivery ? "من الفرع" : "توصيل";
  result.deliveryAddress = isDelivery
    ? orderData.address
    : orderData.restaurant.name;
  result.deliveryCharges = orderData.delivery_charge;
  result.restaurant_charge = orderData.restaurant_charge;
  result.paymentMode = paymentLabel(orderData);

  result.comment = orderData.order_comment;
  result.PIN = orderData.delivery_pin;
  result.tax_amount = orderData.tax_amount;
  result.date = String(orderData.updated_at || "").split(" ");
  result.subTotal = orderData.sub_total;
  result.discount = +orderData.coupon_amount + +orderData.pay_from_wallet;
  result.total = orderData.total;
  result.price = orderData.payable;

  return result;
}

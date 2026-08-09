/* eslint-disable import/no-anonymous-default-export */
import { useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import getPage, { getActiveLang } from "../../../translation";
import { getUserAlerts } from "../../../store";
import { initMyFatoorah } from "../../Checkout";

const getText = getPage("settings"),
  isArabic = getActiveLang() === "العربية",
  nameKey = isArabic ? "name_ar" : "name",
  API = process.env.REACT_APP_API_URL;

/**
 * Order status ids map to a label and a tone. The tone is carried by a class
 * rather than an inline colour pair, so the palette lives in one place.
 */
const STATUS = {
  1: { label: 9, tone: "wait" },
  2: { label: 10, tone: "work" },
  3: { label: 11, tone: "work" },
  4: { label: 12, tone: "work" },
  5: { label: 13, tone: "ok" },
  6: { label: 14, tone: "off" },
  7: { label: 15, tone: "work" },
  8: { label: 16, tone: "wait" },
  9: { label: 17, tone: "off" },
  10: { label: 18, tone: "wait" },
  11: { label: 19, tone: "ok" },
};

export default function () {
  const { User, Products } = useSelector((e) => e),
    orders = User.prevOrders || [];

  if (!orders.length) {
    return (
      <div className="mt-tab">
        <div className="mt-tab__head">
          <h2>{getText(1)}</h2>
        </div>
        <div className="mt-empty">
          <h2>لا توجد طلبات بعد</h2>
          <p>أول طلب لك سيظهر هنا، ومنه تقدر تعيد الطلب أو تعرض الفاتورة.</p>
          <Link className="mt-btn mt-btn--dark" to="/all-products">
            تصفّح المنتجات
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-tab">
      <div className="mt-tab__head">
        <h2>{getText(1)}</h2>
        <span className="mt-tab__count">{orders.length} طلب</span>
      </div>

      <ul className="mt-orders">
        {orders.map((order) => (
          <OrderRow key={order.id} order={order} catalogue={Products.data} />
        ))}
      </ul>
    </div>
  );
}

function OrderRow({ order, catalogue }) {
  const [busy, setBusy] = useState(false);

  const lines = Array.isArray(order.orderitems) ? order.orderitems : [],
    quantity = lines.reduce((n, i) => n + i.quantity, 0),
    price = (+order.total || 0) + (+order.delivery_charge || 0),
    date = String(order.updated_at || "").split(" ")[0].replace(/-/g, "."),
    status = STATUS[order.orderstatus_id],
    statusLabel = status ? getText(status.label) : order.orderstatus_id,
    tone = status ? status.tone : "wait";

  const thumbs = lines
    .slice(0, 4)
    .map((l) => catalogue.find((p) => p.id === l.item_id))
    .filter(Boolean);

  function cancelOrder() {
    setBusy(true);
    const headers = { "Content-Type": "application/json" },
      token = window.localStorage.getItem("token");
    token && (headers.Authorization = token);

    fetch(API + "/public/api/cancel-order", {
      method: "POST",
      headers,
      body: JSON.stringify({ order_id: order.id }),
    })
      .then((r) => r.json())
      // The old handler called window.prevOrders(), a global that is never
      // defined, so cancelling appeared to do nothing until a manual reload.
      .then(getUserAlerts)
      .finally(() => setBusy(false));
  }

  return (
    <li className="mt-order">
      <div className="mt-order__top">
        <span className="mt-order__thumbs">
          {thumbs.length ? (
            thumbs.map((p) => (
              <img key={p.id} src={API + p.image} alt="" loading="lazy" title={p[nameKey] || p.name} />
            ))
          ) : (
            <span className="mt-order__nothumb" aria-hidden="true" />
          )}
        </span>

        <div className="mt-order__meta">
          <b>طلب {order.unique_order_id}</b>
          <span>
            {date} · {quantity} {getText(21)} ·{" "}
            <b className="mt-price">{price.toFixed(2)} ر.س</b>
          </span>
        </div>

        <span className={"mt-order__status is-" + tone}>{statusLabel}</span>
      </div>

      <div className="mt-order__actions">
        {[2, 3, 4, 5, 7, 11].includes(order.orderstatus_id) && (
          <Link to={"/invoice?orderId=" + order.id}>{getText(22)}</Link>
        )}

        {order.orderstatus_id === 8 && order.payment?.session_id && (
          <button
            type="button"
            className="is-pay"
            onClick={() => initMyFatoorah(order.payment.session_id, order.id)}
          >
            أكمل الدفع
          </button>
        )}

        {[1, 10].includes(order.orderstatus_id) && (
          <button type="button" className="is-cancel" onClick={cancelOrder} disabled={busy}>
            {busy ? "جارٍ الإلغاء…" : "إلغاء الطلب"}
          </button>
        )}

        {order.rating ? (
          <span className="mt-order__stars" title={`تقييمك ${order.rating.rating_store} من ٥`}>
            {"★".repeat(order.rating.rating_store)}
            {"☆".repeat(Math.max(0, 5 - order.rating.rating_store))}
          </span>
        ) : (
          <span className="mt-order__norate">لم يتم التقييم بعد</span>
        )}
      </div>
    </li>
  );
}

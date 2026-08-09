/**
 * Cart — direction B.
 *
 * One list of lines and one summary panel that stays in view while you edit, on
 * both desktop and phone. It used to be two entirely separate renderings — a
 * five-column grid on desktop, a different card list under 786px — kept in step
 * by hand.
 *
 * The money is presented, not changed: subtotal, coupon, wallet and total use
 * exactly the arithmetic that was here before, only labelled so it is clear
 * which line is a discount and which is a balance.
 */
/* eslint-disable import/no-anonymous-default-export */
import { useLayoutEffect, useState } from "react";
import { useDispatch, useSelector, useStore } from "react-redux";
import { Link } from "react-router-dom";
import getPage from "../../translation";
import ProductCard from "../Home/ProductCard";
import "./index.scss";

const getText = getPage("cart"),
  isArabic = window.localStorage.getItem("lang") === "العربية",
  nameTarget = isArabic ? "name_ar" : "name",
  baseUrl = process.env.REACT_APP_API_URL;

let couponData = null;

export default function () {
  const products = useSelector((S) => S.Products),
    { cart, data, cashback } = products,
    store = useStore().getState(),
    settings = store.settings.data,
    [err, setErr] = useState("");

  const totalPrice = cart.reduce((n, i) => n + i.price * i.quantity, 0);

  return (
    <div className="mt-page mt-scope">
      <header className="mt-page__head">
        <h1>{getText(1)}</h1>
        <p>
          {cart.length
            ? `${cart.length} صنف في سلتك`
            : "سلتك فارغة في الوقت الحالي"}
        </p>
      </header>

      <CashbackBar totalPrice={totalPrice} source={cashback} />
      <CashbackBar totalPrice={totalPrice} source={settings} />

      {!!err && (
        <p className="mt-cart__err" role="alert">
          {err}
        </p>
      )}

      {cart.length ? (
        <CartBody {...{ cart, totalPrice, setErr, cashback, store }} />
      ) : (
        <div className="mt-empty">
          <h2>سلتك فارغة</h2>
          <p>
            اختر ما يناسب مناسبتك من قائمة الفرع، أو صمّم كيكتك بنفسك بالحجم
            والنكهة اللي تحبها.
          </p>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <Link className="mt-btn mt-btn--primary" to="/all-products">
              تصفّح المنتجات
            </Link>
            <Link className="mt-btn mt-btn--ghost" to="/design">
              صمم كيكتك
            </Link>
          </div>
        </div>
      )}

      <Recommended items={data} />
    </div>
  );
}

/* ------------------------------------------------------------------ coupon */

export function _useCoupon(params, auth, callback, rejectCallback) {
  if (+params.subtotal <= 0) {
    rejectCallback();
    return window.modalOptions.open(getText(21));
  }

  fetch(baseUrl + "/public/api/apply-coupon", {
    method: "POST",
    body: JSON.stringify(params),
    headers: { "Content-Type": "application/json", Authorization: auth },
  })
    .then((r) => r.json())
    .then((r) => {
      if (r.success && r.max_count >= r.count) return callback(r);
      const minReached = r.type === "MINSUBTOTAL" ? getText(21) : getText(22);
      rejectCallback();
      window.modalOptions.open(minReached);
    });
}

/* -------------------------------------------------------------------- body */

function CartBody({ cart, totalPrice, setErr, cashback, store }) {
  const [discount, setDiscount] = useState(0),
    dispatch = useDispatch();

  const userWallet = +store.User.data.wallet_balance || 0,
    restaurant = store.Restaurant;

  let coupon = window.localStorage.getItem("coupon") || "";
  coupon === "" && (couponData = null);

  useLayoutEffect(() => {
    const token = window.localStorage.getItem("token");
    if (coupon !== "" && restaurant.loaded && cart.length) {
      _useCoupon(
        {
          coupon,
          restaurant_id: "" + restaurant.data.id,
          subtotal: "" + (totalPrice - +userWallet),
        },
        token,
        applyCoupon,
        rejectCoupon,
      );
    } else if (token === undefined) setErr(getText(0));
    else couponData = null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coupon, totalPrice, discount]);

  // Unchanged from the previous implementation.
  const payable = Math.max(0, totalPrice - userWallet + +discount);

  function editCartItem(index, quantity) {
    dispatch({ type: "products/updateCartItem", payload: { index, quantity } });
  }

  function addCoupon(value) {
    if (!value) return;
    if (!store.User.loaded) return setErr(getText(20));
    window.localStorage.setItem("coupon", value);
    setDiscount(false);
  }

  function rejectCoupon() {
    window.localStorage.removeItem("coupon");
    couponData = null;
    setDiscount(0);
  }

  function applyCoupon(res) {
    const { discount_type, discount: value } = res;
    setDiscount(
      -(discount_type === "PERCENTAGE"
        ? ((totalPrice - userWallet) / 100) * +value
        : +value),
    );
    couponData = res;
  }

  return (
    <div className="mt-cart">
      <div className="mt-cart__lines">
        <ul>
          {cart.map((item, index) => (
            <CartLine
              key={item.id + "-" + index}
              item={item}
              index={index}
              onEdit={editCartItem}
            />
          ))}
        </ul>

        <Coupon
          value={coupon}
          data={couponData}
          onApply={addCoupon}
          onRemove={rejectCoupon}
        />
      </div>

      <aside className="mt-cart__summary">
        <h2>{getText(12)}</h2>

        <dl>
          <div>
            <dt>{getText(13)}</dt>
            <dd className="mt-price">{totalPrice.toFixed(2)} ر.س</dd>
          </div>

          <div>
            <dt>{getText(16)}</dt>
            <dd className={"mt-price" + (discount ? " is-cut" : "")}>
              {discount === false
                ? getText(17)
                : discount
                  ? `− ${Math.abs(discount).toFixed(2)} ر.س`
                  : "—"}
            </dd>
          </div>

          {userWallet > 0 && (
            <div>
              <dt>
                {getText(15)}
                <small>يُخصم تلقائياً عند الدفع</small>
              </dt>
              <dd className="mt-price is-cut">− {userWallet.toFixed(2)} ر.س</dd>
            </div>
          )}
        </dl>

        <div className="mt-cart__total">
          <span>{getText(18)}</span>
          <b className="mt-price">{payable.toFixed(2)} ر.س</b>
        </div>

        <Link className="mt-btn mt-btn--primary mt-cart__go" to="/checkout">
          {getText(19)}
        </Link>
      </aside>
    </div>
  );
}

/* ------------------------------------------------------------------- lines */

function CartLine({ item, index, onEdit }) {
  const addons = item.addons || [];
  let unit = item.price;
  addons.forEach((a) => (unit += a.price));

  const href =
    "/products/" +
    (item.slug || "product-item") +
    "?id=" +
    item.id +
    "&isCustom=" +
    +(item.category_name === getText(24));

  return (
    <li className="mt-line">
      <Link to={href} className="mt-line__thumb">
        <img
          src={baseUrl + item.img}
          alt=""
          loading="lazy"
          onError={(e) => (e.currentTarget.style.visibility = "hidden")}
        />
      </Link>

      <div className="mt-line__body">
        <Link to={href} className="mt-line__name">
          {item[nameTarget] || item.name}
        </Link>

        <p className="mt-line__addons">
          {addons.length
            ? addons.map((a) => `${a.addon_name} (+${a.price})`).join(" · ")
            : getText(23)}
        </p>

        <span className="mt-line__unit">
          {getText(6)}: <b className="mt-price">{unit.toFixed(2)} ر.س</b>
        </span>
      </div>

      <div className="mt-line__actions">
        <span className="mt-stepper">
          <button type="button" onClick={() => onEdit(index, item.quantity - 1)} aria-label="إنقاص">
            −
          </button>
          <b>{item.quantity}</b>
          <button type="button" onClick={() => onEdit(index, item.quantity + 1)} aria-label="زيادة">
            +
          </button>
        </span>

        <b className="mt-price mt-line__total">
          {(unit * item.quantity).toFixed(2)} ر.س
        </b>

        <button
          type="button"
          className="mt-line__remove"
          onClick={() => onEdit(index, 0)}
          aria-label={`احذف ${item[nameTarget] || item.name} من السلة`}
        >
          حذف
        </button>
      </div>
    </li>
  );
}

/* ------------------------------------------------------------------ coupon */

function Coupon({ value, data, onApply, onRemove }) {
  const [draft, setDraft] = useState(value);

  if (data) {
    return (
      <div className="mt-coupon mt-coupon--on">
        <div>
          <b>
            {data.name}
            <span>
              {data.count} {getText(9)}
            </span>
          </b>
          {data.description && <p>{data.description}</p>}
        </div>
        <button type="button" onClick={onRemove}>
          إزالة
        </button>
      </div>
    );
  }

  return (
    <form
      className="mt-coupon"
      onSubmit={(e) => {
        e.preventDefault();
        onApply(draft.trim());
      }}
    >
      <input
        type="text"
        value={draft}
        onChange={({ target }) => setDraft(target.value)}
        placeholder={getText(10)}
        aria-label={getText(10)}
      />
      <button type="submit" className="mt-btn mt-btn--dark">
        {getText(11)}
      </button>
    </form>
  );
}

/* ---------------------------------------------------------------- cashback */

function CashbackBar({ totalPrice, source }) {
  if (!source) return null;

  const obj = {
    max: +source.max,
    value: +source.min,
    type: source.type || source.wallet_cash_type,
  };

  if (source.wallet_cash_type) {
    const walletTxt = +source.wallet_text;
    if (Number.isNaN(walletTxt) || walletTxt === 0) return null;
    obj.max = +source.wallet_cash_min_order;
    obj.value = +source.wallet_cash_value;
  }

  if (!obj.max) return null;

  const reached = totalPrice >= obj.max,
    pct = Math.min(100, Math.round((totalPrice / obj.max) * 100));

  return (
    <div className={"mt-cashback" + (reached ? " is-on" : "")}>
      <p>
        {reached ? (
          <>
            وصلت للحد — سيُضاف <b>{obj.value}{obj.type === "percentage" ? "٪" : " ر.س"}</b> كاش باك
            إلى محفظتك
          </>
        ) : (
          <>
            {getText(25)}
            <b>{obj.max} ر.س</b>
            {getText(26)}
            <b>{obj.value}{obj.type === "percentage" ? "٪" : " ر.س"}</b>
            {getText(27)}
          </>
        )}
      </p>
      <div className="mt-cashback__bar">
        <i style={{ width: pct + "%" }} />
      </div>
    </div>
  );
}

function Recommended({ items }) {
  const picks = (items || []).filter((i) => i.is_popular).slice(0, 4);
  if (!picks.length) return null;

  return (
    <section>
      <div className="mt-section-head">
        <h2>{getText(28)}</h2>
        <Link to="/all-products">عرض الكل</Link>
      </div>
      <div className="mt-grid">
        {picks.map((item) => (
          <ProductCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}

export function calcCashback(totalPrice, cashback, setting) {
  const obj = {};

  if (cashback) {
    obj.max = +cashback.max;
    obj.value = +cashback.min;
    obj.type = cashback.type;
  } else if (setting && setting.enCashBack === "true") {
    obj.max = +setting.wallet_cash_min_order;
    obj.value = +setting.wallet_cash_value;
    obj.type = setting.wallet_cash_type;
  } else return 0;

  obj.type === "percentage" && (obj.value = (obj.value / 100) * totalPrice);
  return totalPrice >= obj.max ? obj.value : 0;
}

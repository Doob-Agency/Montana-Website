/**
 * Product card for the redesigned homepage.
 *
 * Three things a cake shopper decides on before anything else — price, how many
 * people it feeds, and whether it can be had today — are all on the face of the
 * card. The old card led with a calorie count and a hardcoded 4.7 rating.
 */
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getActiveLang } from "../../translation";
import { checkStatus } from "../Product";

const isArabic = getActiveLang() === "العربية",
  nameKey = isArabic ? "name_ar" : "name",
  API = process.env.REACT_APP_API_URL;

export default function ProductCard({ item }) {
  const dispatch = useDispatch(),
    settings = useSelector((e) => e.settings).data || {},
    restaurantId = useSelector((e) => e.Restaurant).data.id,
    cart = useSelector((e) => e.Products).cart;

  const { isAvailable, status } = checkStatus(item, settings),
    price = +item.price,
    oldPrice = +item.old_price,
    inCart = cart.find((c) => c.id === item.id),
    quantity = inCart ? inCart.quantity : 0;

  const href =
    "/products/" +
    (item.slug || "product-item") +
    "?id=" +
    item.id +
    "&isCustom=" +
    +(item.category_name === "الحجز المبكر");

  function setQuantity(next) {
    dispatch({
      type: "products/addToCart",
      payload: {
        slug: item.slug,
        quantity: Math.max(next, 0),
        img: item.image,
        restaurant_id: +restaurantId,
        id: item.id,
        name: item.name,
        name_ar: item.name_ar,
        category_name: item.category_name,
        category_id: item.item_category_id,
        price,
        addons: [],
      },
    });
  }

  return (
    <article className={"mt-card" + (isAvailable ? "" : " mt-card--off")}>
      <Link to={href} className="mt-card__media">
        <img
          src={API + item.image}
          alt={item[nameKey] || item.name}
          loading="lazy"
          decoding="async"
        />
        <Availability item={item} isAvailable={isAvailable} status={status} />
        {oldPrice > price && (
          <span className="mt-card__save">
            وفّر {Math.round(100 - (price / oldPrice) * 100)}%
          </span>
        )}
      </Link>

      <div className="mt-card__body">
        <Link to={href} className="mt-card__name">
          {item[nameKey] || item.name}
        </Link>

        <p className="mt-card__meta">{item.category_name}</p>

        <div className="mt-card__buy">
          <span className="mt-price">
            {oldPrice > price && <del>{oldPrice}</del>}
            {price.toFixed(2)} <small>ر.س</small>
          </span>

          {isAvailable ? (
            quantity > 0 ? (
              <span className="mt-stepper">
                <button
                  type="button"
                  onClick={() => setQuantity(quantity - 1)}
                  aria-label="إنقاص الكمية"
                >
                  −
                </button>
                <b>{quantity}</b>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  aria-label="زيادة الكمية"
                >
                  +
                </button>
              </span>
            ) : (
              <button
                type="button"
                className="mt-card__add"
                onClick={() => setQuantity(1)}
                aria-label={`أضف ${item[nameKey] || item.name} إلى السلة`}
              >
                +
              </button>
            )
          ) : null}
        </div>
      </div>
    </article>
  );
}

/**
 * Availability is carried by wording and colour together, never colour alone —
 * "today" and "needs 24h" are the difference between a birthday saved and one
 * missed.
 */
function Availability({ item, isAvailable, status }) {
  if (!isAvailable) {
    return <span className="mt-flag mt-flag--off">{status}</span>;
  }

  if (item.category_name === "الحجز المبكر") {
    return <span className="mt-flag mt-flag--wait">حجز مبكر</span>;
  }

  return <span className="mt-flag mt-flag--ok">متوفرة اليوم</span>;
}

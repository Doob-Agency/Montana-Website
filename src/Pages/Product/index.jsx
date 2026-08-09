/**
 * Product page — direction B.
 *
 * The buying decision lives above the fold: photo, price, availability in
 * words, add-ons, and a quantity control that shows what the line will actually
 * cost. The previous version put a calorie count and a nutrition accordion
 * between the price and the buy button, and confirmed an add-to-cart by
 * covering the whole panel with an animated GIF for three seconds.
 */
/* eslint-disable import/no-anonymous-default-export */
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useSearchParams } from "react-router-dom";
import getPage, { getActiveLang, inlineArEn } from "../../translation";
import { ordinaryCategories } from "../All_Products";
import ProductCard from "../Home/ProductCard";
import "./index.scss";

const nutritionInfo = window.Nutriants,
  nutrients = Object.keys(nutritionInfo);

const getText = getPage("product"),
  isArabic = getActiveLang() === "العربية",
  priceTypes = window.priceTypes,
  API = process.env.REACT_APP_API_URL;

export default function () {
  const Products = useSelector(($) => $.Products),
    [query] = useSearchParams(),
    id = query.get("id"),
    isCustom = query.get("isCustom");

  const productId = parseInt(id, 10),
    items = Products[+isCustom ? "early_booking" : "data"],
    state = items.find((e) => e.id === productId);

  // The catalogue arrives after the first paint, so "not found yet" and "does
  // not exist" are different things. Rendering null for both left a blank page.
  if (!Products.loaded) {
    return (
      <div className="mt-page">
        <div className="mt-product">
          <div className="mt-product__media mt-skeleton" style={{ minHeight: 380 }} />
          <div className="mt-product__panel">
            <span className="mt-skeleton" style={{ height: 28, width: "70%" }} />
            <span className="mt-skeleton" style={{ height: 16, width: "40%" }} />
            <span className="mt-skeleton" style={{ height: 90 }} />
          </div>
        </div>
      </div>
    );
  }

  if (!state) {
    return (
      <div className="mt-page">
        <div className="mt-empty">
          <h2>هذا الصنف غير موجود في الفرع المختار</h2>
          <p>
            قد يكون متاحاً في فرع آخر، أو تكون قد تغيّرت قائمة هذا الفرع. جرّب
            تصفّح كل الأصناف.
          </p>
          <Link className="mt-btn mt-btn--dark" to="/all-products">
            تصفّح كل المنتجات
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-page mt-scope">
      <ProductInfo key={state.id} state={state} />
      <Related items={items} exclude={state.id} categoryID={state.item_category_id} />
    </div>
  );
}

function ProductInfo({ state }) {
  const settings = useSelector((e) => e.settings).data || {},
    resId = useSelector((e) => e.Restaurant).data.id,
    cartItems = useSelector((e) => e.Products).cart,
    dispatch = useDispatch();

  const [currCategoryName, setAddonCat] = useState(""),
    [justAdded, setJustAdded] = useState(false),
    [, forceUpdate] = useState(false),
    selectedAddons = useRef(new Set()).current;

  // A quiet confirmation that clears itself, instead of a full-panel GIF that
  // blocked the page for three seconds after every tap.
  useEffect(() => {
    if (!justAdded) return;
    const t = setTimeout(() => setJustAdded(false), 2200);
    return () => clearTimeout(t);
  }, [justAdded]);

  const { isAvailable, status } = checkStatus(state, settings),
    cartRef = cartItems.find((e) => e.id === state.id),
    quantity = cartRef ? cartRef.quantity : 0;

  const price = +state.price,
    oldPrice = +state.old_price,
    discounted = oldPrice > price,
    priceType = isArabic
      ? priceTypes[state.price_type]
      : String(state.price_type || "").replace(/_/g, " ").toUpperCase();

  const categories = state.addon_categories || [],
    currCategory = categories.find((c) => c.name === currCategoryName),
    isSingular = currCategory?.type === "SINGLE";

  let addonsTotal = 0;
  selectedAddons.forEach((a) => (addonsTotal += +a.price));
  const lineTotal = (price + addonsTotal) * Math.max(quantity, 1);

  function toggleAddon(addon) {
    if (selectedAddons.has(addon)) selectedAddons.delete(addon);
    else {
      // A SINGLE category is a radio group: picking one drops the previous.
      if (isSingular && currCategory) {
        currCategory.addons.forEach((a) => selectedAddons.delete(a));
      }
      selectedAddons.add(addon);
    }
    forceUpdate((v) => !v);
  }

  function setQuantity(next) {
    const q = Math.max(0, next);

    const addons = [...selectedAddons].map(({ id, price: p, name, addon_category_id }) => ({
      addon_id: id,
      addon_category_name: (categories.find((c) => c.id === addon_category_id) || {}).name,
      addon_name: name,
      price: +p,
    }));

    dispatch({
      type: "products/addToCart",
      payload: {
        id: state.id,
        img: state.image,
        name: state.name,
        slug: state.slug,
        name_ar: state.name_ar,
        category_name: state.category_name,
        category_id: state.item_category_id,
        price,
        restaurant_id: +resId,
        quantity: q,
        addons,
        totalPrice: (price + addonsTotal) * q,
      },
    });

    if (q > 0) setJustAdded(true);
  }

  const productName = (isArabic && state.name_ar) || state.name,
    description = (isArabic && state.desc_ar) || state.desc;

  setDocumentMeta(state, productName);

  return (
    <section className="mt-product">
      <div className="mt-product__media">
        <img
          src={API + (state.image || "")}
          alt={productName}
          onError={(e) => {
            e.currentTarget.style.display = "none";
            e.currentTarget.parentElement.dataset.noImage = "true";
          }}
        />
        {discounted && (
          <span className="mt-card__save">
            وفّر {Math.round(100 - (price / oldPrice) * 100)}%
          </span>
        )}
      </div>

      <div className="mt-product__panel">
        <p className="mt-product__crumb">{state.category_name}</p>
        <h1>{productName}</h1>

        <p className={"mt-product__state" + (isAvailable ? "" : " is-off")}>
          {isAvailable ? "متوفرة اليوم" : status}
        </p>

        <div className="mt-product__price">
          <span className="mt-price">
            {price.toFixed(2)} <small>ر.س</small>
          </span>
          {discounted && <del>{oldPrice.toFixed(2)}</del>}
          {priceType && <em>/ {priceType}</em>}
        </div>

        {description && (
          <div
            className="mt-product__desc"
            // Copy is authored in the dashboard as HTML.
            dangerouslySetInnerHTML={{ __html: description }}
          />
        )}

        {!!categories.length && (
          <div className="mt-product__addons">
            <h2>{getText(8)}</h2>

            <div className="mt-product__addoncats">
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className="mt-chip"
                  aria-pressed={c.name === currCategoryName}
                  onClick={() => setAddonCat(c.name === currCategoryName ? "" : c.name)}
                >
                  {c.name}
                </button>
              ))}
            </div>

            {currCategory && (
              <ul className="mt-product__addonlist">
                {currCategory.addons
                  .filter((a) => a.is_active)
                  .map((addon) => {
                    const on = selectedAddons.has(addon);
                    return (
                      <li key={addon.id}>
                        <button type="button" aria-pressed={on} onClick={() => toggleAddon(addon)}>
                          <b>{addon.name}</b>
                          <span className="mt-price">+{(+addon.price).toFixed(2)}</span>
                          <i aria-hidden="true">{on ? "−" : "+"}</i>
                        </button>
                      </li>
                    );
                  })}
              </ul>
            )}
          </div>
        )}

        <NutritionFacts item={state} />

        {isAvailable ? (
          <div className="mt-product__buy">
            {quantity > 0 ? (
              <span className="mt-stepper mt-stepper--lg">
                <button type="button" onClick={() => setQuantity(quantity - 1)} aria-label="إنقاص">
                  −
                </button>
                <b>{quantity}</b>
                <button type="button" onClick={() => setQuantity(quantity + 1)} aria-label="زيادة">
                  +
                </button>
              </span>
            ) : (
              <button
                type="button"
                className="mt-btn mt-btn--primary mt-product__add"
                onClick={() => setQuantity(1)}
              >
                {getText(10) || "أضف إلى السلة"}
              </button>
            )}

            <span className="mt-product__total">
              <em>الإجمالي</em>
              <b className="mt-price">
                {lineTotal.toFixed(2)} <small>ر.س</small>
              </b>
            </span>

            {quantity > 0 && (
              <Link to="/cart" className="mt-btn mt-btn--dark">
                إتمام الطلب
              </Link>
            )}
          </div>
        ) : (
          <p className="mt-product__unavailable">{status}</p>
        )}

        <p className="mt-product__toast" data-show={justAdded} role="status">
          {getText(2) || "تمت الإضافة إلى السلة"}
        </p>
      </div>
    </section>
  );
}

function NutritionFacts({ item }) {
  const pills = nutrients
    .filter((k) => !!item[k])
    .map((keyName) => {
      const target = nutritionInfo[keyName];
      return (
        <li key={keyName}>
          {target.icon} {item[keyName]} {target[isArabic ? "ar" : "en"]}
        </li>
      );
    });

  if (!pills.length) return null;

  return (
    <details className="mt-product__nutrition">
      <summary>الحقائق التغذوية</summary>
      <ul>{pills}</ul>
    </details>
  );
}

function Related({ items, exclude, categoryID }) {
  const related = items
    .filter((i) => i.item_category_id === categoryID && i.id !== exclude)
    .slice(0, 8);

  if (!related.length) return null;

  return (
    <section>
      <div className="mt-section-head">
        <h2>{getText(11)}</h2>
        <Link to="/all-products">عرض الكل</Link>
      </div>
      <div className="mt-grid">
        {related.map((item) => (
          <ProductCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}

function setDocumentMeta(state, productName) {
  document.title =
    state.meta_title || (isArabic ? "مونتانا" : "Montana") + " — " + productName;

  const tag = document.querySelector('meta[name="description"]');
  if (tag && state.meta_description) tag.setAttribute("content", state.meta_description);
}

export function checkStatus(item, settings) {
  const result = { isAvailable: true, status: getText(4) },
    isOrdinary = ordinaryCategories.includes(item.item_category_id);

  if (isOrdinary && settings.enstock === "true") {
    result.isAvailable = !!item.is_active && item.stock > 0;
    !result.isAvailable && (result.status = getText(5));
  } else if (!item.is_active) {
    result.isAvailable = false;
    result.status = inlineArEn("غير متوفر", "unavailable");
  }

  return result;
}

/**
 * Catalogue — direction B.
 *
 * This is where the header search lands and where every category chip points,
 * so it is the busiest page after the homepage. It now shares the homepage's
 * product card, filters read as chips rather than a bare list, and the result
 * count is stated so an empty result reads as "nothing matched" instead of a
 * page that failed to load.
 */
/* eslint-disable import/no-anonymous-default-export */
import { useState } from "react";
import { useSelector } from "react-redux";
import { useParams, useSearchParams } from "react-router-dom";
import ProductCard from "./Home/ProductCard";
import getPage from "../translation";
import "./all-products.scss";

export const ordinaryCategories = [1, 2, 3, 4, 5, 6, 7];

const getText = getPage("allProducts"),
  emptyStr = "";

export default function () {
  const urlParams = useParams(),
    urlCat = urlParams.category || emptyStr,
    { data, loaded } = useSelector((e) => e.Products),
    [params] = useSearchParams();

  const [productName, setProductName] = useState(emptyStr),
    [category, setCategory] = useState(urlCat);

  // The header search arrives as ?q=…; seed the filter from it so the page
  // opens on the term instead of the whole catalogue.
  const queryParam = params.get("q") || emptyStr,
    [seededQuery, setSeededQuery] = useState(emptyStr);

  if (queryParam && queryParam !== seededQuery) {
    setSeededQuery(queryParam);
    setProductName(queryParam);
  }

  const viewOccassions = params.has("occassions"),
    // A search from the header means "find this anywhere", so it looks across
    // the whole catalogue. Scoping it the way browsing is scoped made searching
    // "تخرج" return nothing at all, because the graduation cakes sit outside
    // the ordinary categories this page normally lists.
    searching = productName.trim().length > 0,
    scoped = searching
      ? data
      : data.filter(
          (i) => viewOccassions !== ordinaryCategories.includes(i.item_category_id),
        );

  const availCategories = new Set();
  scoped.forEach((i) => availCategories.add(i.category_name));

  const nameExp = new RegExp(escapeForSearch(productName), "i"),
    matches = scoped.filter(
      (item) =>
        item.category_name.includes(category) &&
        (nameExp.test(item.name) || nameExp.test(item.name_ar || emptyStr)),
    );

  const heading = urlCat || getText(viewOccassions ? 3 : 2);

  return (
    <div className="mt-page mt-scope">
      <header className="mt-page__head">
        <h1>{heading}</h1>
        <p>
          {loaded
            ? `${matches.length} من ${scoped.length} صنف`
            : "جارٍ تحميل القائمة…"}
        </p>
      </header>

      <div className="mt-catalogue">
        <aside className="mt-filters">
          <label className="mt-filters__search">
            <span className="visually-hidden">{getText(0)}</span>
            <input
              type="search"
              placeholder={getText(0)}
              value={productName}
              onChange={({ target }) => setProductName(target.value)}
            />
          </label>

          <div className="mt-filters__group">
            <h2>{getText(1)}</h2>
            <div className="mt-filters__chips">
              <button
                type="button"
                className="mt-chip"
                aria-pressed={category === emptyStr}
                onClick={() => setCategory(emptyStr)}
              >
                الكل
              </button>

              {Array.from(availCategories).map((c) => (
                <button
                  key={c}
                  type="button"
                  className="mt-chip"
                  aria-pressed={c === category}
                  onClick={() => setCategory(category === c ? emptyStr : c)}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {(productName || category) && (
            <button
              type="button"
              className="mt-filters__clear"
              onClick={() => {
                setProductName(emptyStr);
                setCategory(emptyStr);
              }}
            >
              مسح الفلاتر
            </button>
          )}
        </aside>

        <div className="mt-catalogue__results">
          {!loaded ? (
            <div className="mt-grid">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="mt-card">
                  <div className="mt-card__media mt-skeleton" />
                  <div className="mt-card__body">
                    <span className="mt-skeleton" style={{ height: 14 }} />
                    <span className="mt-skeleton" style={{ height: 10, width: "55%" }} />
                  </div>
                </div>
              ))}
            </div>
          ) : matches.length ? (
            <div className="mt-grid">
              {matches.map((item) => (
                <ProductCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div className="mt-empty">
              <h2>لا يوجد صنف بهذا الوصف</h2>
              <p>
                {productName
                  ? `لم نجد نتائج لـ «${productName}» في هذا الفرع. جرّب كلمة أقصر أو امسح الفلاتر.`
                  : "لا توجد أصناف في هذا القسم داخل الفرع المختار. جرّب فرعاً آخر من الأعلى."}
              </p>
              <button
                type="button"
                className="mt-btn mt-btn--dark"
                onClick={() => {
                  setProductName(emptyStr);
                  setCategory(emptyStr);
                }}
              >
                عرض كل الأصناف
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * The term goes straight into a RegExp, so an unbalanced bracket typed into the
 * search box used to throw and blank the page.
 */
function escapeForSearch(term) {
  return term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Homepage — direction B, "الرفّ".
 *
 * Ordered as an operating surface rather than a brochure: what the shopper can
 * buy right now comes first, and the features the dashboard already manages —
 * wallet, cashback, scheduling, delivery areas — are visible instead of buried.
 *
 * Nothing here filters on a hardcoded category id. The previous homepage kept
 * lists like `excluded = [3,4,5,6,7]` in the source, so adding a category in the
 * dashboard silently changed or emptied a section.
 */
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import getPage, { getActiveLang } from "../../translation";
import { todaysHours } from "../../Header/hours";
import ProductCard from "./ProductCard";
import "./index.scss";

const getText = getPage("home"),
  isArabic = getActiveLang() === "العربية",
  nameKey = isArabic ? "name_ar" : "name",
  descKey = isArabic ? "description_ar" : "description",
  API = process.env.REACT_APP_API_URL;

export default function Home() {
  return (
    <div className="mt-scope">
      <CategoryRail />
      <Highlights />
      <Reorder />
      <ProductShelf
        id="best-sellers"
        title={getText(12)}
        pick={(item) => !!item.is_popular}
        href="/all-products"
      />
      <WalletBand />
      <ProductShelf
        id="new-items"
        title={getText(11)}
        pick={(item) => !!item.is_new}
        href="/all-products"
      />
      <ScheduleBand />
      <BranchesBand />
    </div>
  );
}

/* ------------------------------------------------------------- categories */

function CategoryRail() {
  const { miniCategories } = useSelector((e) => e.Products);

  if (!miniCategories.length) {
    return (
      <div className="mt-catrail">
        <div className="mt-shell mt-rail" aria-hidden="true">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <span key={i} className="mt-cat">
              <span className="mt-cat__img mt-skeleton" />
              <span className="mt-skeleton" style={{ height: 10, width: 52 }} />
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <nav className="mt-catrail" aria-label={getText(13)}>
      <div className="mt-shell mt-rail">
        {miniCategories.map((category) => (
          <Link
            key={category.id}
            className="mt-cat"
            to={
              "/all-products/" +
              encodeURIComponent(category.name) +
              "?miniCategories=1"
            }
          >
            <span className="mt-cat__img">
              <img
                src={category.image_url}
                alt=""
                loading="lazy"
                decoding="async"
              />
            </span>
            <span className="mt-cat__name">{category.name}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}

/* --------------------------------------------------------------- services */

function Highlights() {
  const { main, other } = useSelector((e) => e.Sliders);

  // Both services exist as routes whether or not a slide has been filled in
  // from the dashboard, so the cards always render and the slide only supplies
  // artwork and copy when it has any. The old section vanished entirely on an
  // empty slider, taking the two highest-margin entry points with it.
  return (
    <section className="mt-shell mt-band">
      <div className="mt-duo">
        <HighlightCard
          slide={main}
          to="/design"
          cta={getText(9)}
          title={getText(5)}
          blurb={getText(6)}
        />
        <HighlightCard
          slide={other}
          to="/early-booking"
          cta={getText(10)}
          title="الحجز المبكر"
          blurb="احجز كيكة مناسبتك قبل موعدها، وثبّت السعر من اليوم."
        />
      </div>
    </section>
  );
}

function HighlightCard({ slide, to, cta, title, blurb }) {
  const image = slide && slide.image,
    heading = (slide && (slide[nameKey] || slide.name)) || title,
    // Slide copy is authored in the dashboard; strip the markup rather than
    // injecting it, so a stray tag cannot break the layout.
    body = stripTags(slide && slide[descKey]) || blurb;

  return (
    <Link className="mt-duo__card" to={to}>
      {image && <img src={image} alt="" loading="lazy" decoding="async" />}
      <div className="mt-duo__copy">
        <h2>{heading}</h2>
        <p>{body}</p>
        <span className="mt-btn mt-btn--primary">{cta}</span>
      </div>
    </Link>
  );
}

function stripTags(html) {
  if (!html) return "";
  return String(html)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/* ---------------------------------------------------------------- reorder */

function Reorder() {
  const { prevOrders, loaded } = useSelector((e) => e.User),
    catalogue = useSelector((e) => e.Products).data,
    restaurantId = useSelector((e) => e.Restaurant).data.id,
    dispatch = useDispatch(),
    redirect = useNavigate();

  // A cancelled or partially-migrated order can come back without its lines;
  // those cannot be repeated, so they never reach the rail.
  const orders = (prevOrders || [])
    .filter((order) => Array.isArray(order.orderitems) && order.orderitems.length)
    .slice(0, 6);

  if (!loaded || !orders.length || !catalogue.length) return null;

  /**
   * Puts the order back in the cart. Items the branch no longer carries are
   * skipped rather than blocking the whole repeat — a discontinued flavour
   * should not cost the shopper the other five things they wanted.
   */
  function repeat(order) {
    let added = 0;

    order.orderitems.forEach((line) => {
      const item = catalogue.find((p) => p.id === line.item_id);
      if (!item) return;

      added++;
      dispatch({
        type: "products/addToCart",
        payload: {
          slug: item.slug,
          quantity: line.quantity,
          img: item.image,
          restaurant_id: +restaurantId,
          id: item.id,
          name: item.name,
          name_ar: item.name_ar,
          category_name: item.category_name,
          category_id: item.item_category_id,
          price: +item.price,
          addons: [],
        },
      });
    });

    added ? redirect("/cart") : redirect("/all-products");
  }

  return (
    <section className="mt-shell mt-band">
      <div className="mt-section-head">
        <h2>اطلب مرة أخرى</h2>
        <Link to="/settings/history">كل طلباتي</Link>
      </div>

      <div className="mt-rail">
        {orders.map((order) => {
          const count = order.orderitems.reduce((n, i) => n + i.quantity, 0),
            total = (+order.total || 0) + (+order.delivery_charge || 0),
            date = String(order.updated_at || "").split(" ")[0];

          return (
            <article key={order.id} className="mt-reorder">
              <span className="mt-reorder__thumbs">
                {order.orderitems.slice(0, 3).map((line) => {
                  const item = catalogue.find((p) => p.id === line.item_id);
                  return (
                    <img
                      key={line.id || line.item_id}
                      src={item ? API + item.image : ""}
                      alt=""
                      loading="lazy"
                    />
                  );
                })}
              </span>

              <span className="mt-reorder__body">
                <b>طلب {order.unique_order_id}</b>
                <small>
                  {date} · {count} صنف · {total.toFixed(2)} ر.س
                </small>
              </span>

              <button
                type="button"
                className="mt-btn mt-btn--ghost"
                onClick={() => repeat(order)}
              >
                أعد الطلب
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------- shelves */

function ProductShelf({ id, title, pick, href }) {
  const { data, loaded } = useSelector((e) => e.Products);

  if (!loaded) return <ShelfSkeleton title={title} />;

  const items = data.filter(pick).slice(0, 8);
  if (!items.length) return null;

  return (
    <section id={id} className="mt-shell mt-band">
      <div className="mt-section-head">
        <h2>{title}</h2>
        <Link to={href}>عرض الكل</Link>
      </div>

      <div className="mt-grid">
        {items.map((item) => (
          <ProductCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}

/**
 * Sections hold their height while the catalogue loads. Returning null instead
 * made the whole page jump as each request landed.
 */
function ShelfSkeleton({ title }) {
  return (
    <section className="mt-shell mt-band">
      <div className="mt-section-head">
        <h2>{title}</h2>
      </div>
      <div className="mt-grid" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="mt-card">
            <div className="mt-card__media mt-skeleton" />
            <div className="mt-card__body">
              <span className="mt-skeleton" style={{ height: 14 }} />
              <span
                className="mt-skeleton"
                style={{ height: 10, width: "55%" }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------- wallet */

function WalletBand() {
  const { loaded, data } = useSelector((e) => e.User),
    cashback = useSelector((e) => e.Products).cashback,
    branch = useSelector((e) => e.Restaurant).data;

  // Signed out: sell the reason to sign in rather than an empty balance.
  if (!loaded) {
    return (
      <section className="mt-shell mt-band">
        <div className="mt-wallet mt-wallet--guest">
          <div>
            <h2>محفظة مونتانا</h2>
            <p>
              سجّل دخولك لتتبّع رصيدك، واسترداد جزء من قيمة كل طلب، والدفع بضغطة
              واحدة.
            </p>
          </div>
          <Link className="mt-btn mt-btn--primary" to="/user">
            تسجيل الدخول
          </Link>
        </div>
      </section>
    );
  }

  const balance = +(data.balance ?? data.wallet_balance ?? 0),
    freeFrom = +(branch.free_delivery_subtotal || 0);

  return (
    <section className="mt-shell mt-band">
      <div className="mt-wallet">
        <div className="mt-wallet__cell">
          <span className="mt-wallet__k">رصيد محفظتك</span>
          <span className="mt-wallet__v">
            {balance.toFixed(2)} <em>ر.س</em>
          </span>
        </div>

        {cashback && (
          <div className="mt-wallet__cell">
            <span className="mt-wallet__k">استرداد نقدي على كل طلب</span>
            <span className="mt-wallet__v">
              {cashback.amount}
              {cashback.type === "percentage" ? "٪" : " ر.س"}
            </span>
          </div>
        )}

        {freeFrom > 0 && (
          <div className="mt-wallet__cell">
            <span className="mt-wallet__k">التوصيل مجاني ابتداءً من</span>
            <span className="mt-wallet__v">
              {freeFrom.toFixed(2)} <em>ر.س</em>
            </span>
          </div>
        )}

        <Link className="mt-btn mt-btn--primary" to="/settings/wallet">
          إدارة المحفظة
        </Link>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- schedule */

function ScheduleBand() {
  const branch = useSelector((e) => e.Restaurant).data;

  // Only claim scheduling where the branch actually accepts it.
  if (!branch.accept_scheduled_orders && !branch.is_orderscheduling) return null;

  return (
    <section className="mt-shell mt-band">
      <div className="mt-schedule">
        <div>
          <h2>اطلب اليوم، واستلم في اليوم الذي تختاره</h2>
          <p>
            كل ما يُطلب مسبقاً يُحضَّر في يومه — لا شيء يُخزَّن. اختر تاريخ
            التسليم ووقته عند إتمام الطلب
            {branch.schedule_slot_buffer
              ? `، مع مهلة تحضير ${branch.schedule_slot_buffer} دقيقة.`
              : "."}
          </p>
        </div>

        <Link className="mt-btn mt-btn--dark" to="/all-products">
          ابدأ طلباً مجدولاً
        </Link>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- branches */

/**
 * `get-all-restaurant` returns only id/name/slug/image per branch — delivery
 * times, fees and opening hours exist solely on `get-restaurant-info/{slug}`,
 * which is fetched for the selected branch alone. So this band states the real
 * terms for the branch in use and lists the rest as somewhere to switch to,
 * rather than printing ten cards of blanks.
 */
function BranchesBand() {
  const { data: current, branches } = useSelector((e) => e.Restaurant);

  if (!branches.length) return null;

  const hours = todaysHours(current),
    fee = +(current.delivery_charges || 0),
    freeFrom = +(current.free_delivery_subtotal || 0),
    minOrder = +(current.min_order_price || 0);

  return (
    <section className="mt-shell mt-band">
      <div className="mt-section-head">
        <h2>الفروع ومناطق التوصيل</h2>
        <Link to="/restaurant">كل الفروع</Link>
      </div>

      <div className="mt-branchband">
        {!!current.name && (
          <article className="mt-branch mt-branch--current">
            <span className="mt-branch__tag">فرعك الحالي</span>
            <h3>{current.name}</h3>

            {hours && (
              <p
                className={"mt-branch__state" + (hours.isOpen ? "" : " is-shut")}
              >
                {hours.isOpen ? "مفتوح الآن" : "مغلق الآن"} · {hours.open} —{" "}
                {hours.close}
              </p>
            )}

            <ul className="mt-branch__facts">
              {!!current.delivery_time && (
                <li>
                  <span>وقت التوصيل</span>
                  <b>{current.delivery_time} دقيقة</b>
                </li>
              )}
              <li>
                <span>رسوم التوصيل</span>
                <b>{fee > 0 ? `${fee.toFixed(2)} ر.س` : "مجاني"}</b>
              </li>
              {freeFrom > 0 && (
                <li>
                  <span>توصيل مجاني ابتداءً من</span>
                  <b>{freeFrom.toFixed(2)} ر.س</b>
                </li>
              )}
              {minOrder > 0 && (
                <li>
                  <span>أقل قيمة للطلب</span>
                  <b>{minOrder.toFixed(2)} ر.س</b>
                </li>
              )}
            </ul>
          </article>
        )}

        <div className="mt-branchlist">
          <h3>{branches.length} فروع في جدة</h3>
          <ul>
            {branches.map((branch) => (
              <li key={branch.slug}>
                <Link
                  to="/restaurant"
                  aria-current={branch.slug === current.slug}
                >
                  {branch.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

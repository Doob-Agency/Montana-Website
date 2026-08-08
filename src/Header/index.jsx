/**
 * The order bar.
 *
 * Everything a shopper has to settle before they can order — which branch,
 * delivery or pickup, whether the branch is open, and what they are looking for
 * — now lives in one bar that stays put while they scroll. It replaces a header
 * that hid the branch switcher in a pale strip above the logo and offered no
 * search at all on desktop.
 */
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation, useNavigate } from "react-router-dom";
import getPage, { keys, getActiveLang } from "../translation";
import { logout } from "../store";
import { useFeature } from "../store/features";
import { DELIVERY, PICKUP, getOrderMode, setOrderMode } from "../store/orderMode";
import { todaysHours } from "./hours";
import {
  BellIcon,
  CartIcon,
  ChevronIcon,
  ClockIcon,
  GlobeIcon,
  MenuIcon,
  PinIcon,
  SearchIcon,
  StoreIcon,
  TruckIcon,
  UserIcon,
} from "./icons";
import "./index.scss";

const getText = getPage("header"),
  baseUrl = process.env.REACT_APP_API_URL + "/public/api/",
  fetchOpts = {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
  };

/**
 * Switching branch swaps the whole catalogue, so anything pinned to a single
 * item has to be left behind. Browsing pages survive the switch.
 */
const ITEM_BOUND = /^\/(products|invoice|checkout|payment)/;

export default function Header() {
  return <OrderBar />;
}

function OrderBar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="mt-orderbar">
      <div className="mt-orderbar__row mt-shell">
        <button
          type="button"
          className="mt-orderbar__menu"
          aria-label={getText(5)}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(true)}
        >
          <MenuIcon />
        </button>

        <Link to="/" className="mt-orderbar__logo" aria-label="مونتانا">
          <img
            src={process.env.PUBLIC_URL + "/assets/home/logo.svg"}
            alt="حلويات مونتانا"
            width="118"
            height="44"
          />
        </Link>

        <BranchPicker />
        <ModeToggle />
        <OpenState />
        <SearchField />

        <nav className="mt-orderbar__links" aria-label="روابط سريعة">
          <Link to="/all-products">{getText(0)}</Link>
          <Link to="/design">صمم كيكتك</Link>
        </nav>

        <div className="mt-orderbar__actions">
          <AlertsButton />
          <AccountMenu />
          <CartButton />
        </div>
      </div>

      <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  );
}

/* ------------------------------------------------------------------ branch */

function BranchPicker() {
  const { data: current, branches } = useSelector((e) => e.Restaurant),
    [open, setOpen] = useState(false),
    dispatch = useDispatch(),
    redirect = useNavigate(),
    location = useLocation();

  const label = current.name || "اختر الفرع";

  function pick(slug) {
    setOpen(false);

    fetch(baseUrl + "get-restaurant-info/" + slug, fetchOpts)
      .then((res) => res.json())
      .then((data) => {
        dispatch({ type: "restaurant/init", payload: data });

        return fetch(baseUrl + "get-restaurant-items/" + slug, fetchOpts)
          .then((res) => res.json())
          .then((items) =>
            dispatch({ type: "products/init", payload: items }),
          );
      })
      .then(() => {
        // Only leave the page when it was about one specific item, which the
        // new branch may not carry. Browsing used to be reset to the homepage
        // on every switch.
        if (ITEM_BOUND.test(location.pathname)) redirect("/");
      });
  }

  return (
    <div className="mt-picker">
      <button
        type="button"
        className="mt-picker__btn"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <PinIcon width="16" height="16" />
        <span className="mt-picker__label">
          <em>الفرع</em>
          <b>{label}</b>
        </span>
        <ChevronIcon width="16" height="16" />
      </button>

      {open && (
        <>
          <div className="mt-picker__scrim" onClick={() => setOpen(false)} />
          <ul className="mt-picker__list">
            {branches.map((branch) => (
              <li key={branch.slug}>
                <button
                  type="button"
                  onClick={() => pick(branch.slug)}
                  aria-current={branch.slug === current.slug}
                >
                  <span>{branch.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

/* -------------------------------------------------------------- order mode */

function ModeToggle() {
  const [mode, setMode] = useState(getOrderMode);

  function choose(next) {
    setOrderMode(next);
    setMode(next);
  }

  return (
    <div className="mt-seg" role="group" aria-label="طريقة الاستلام">
      <button
        type="button"
        aria-pressed={mode === DELIVERY}
        onClick={() => choose(DELIVERY)}
      >
        <TruckIcon width="15" height="15" />
        توصيل
      </button>
      <button
        type="button"
        aria-pressed={mode === PICKUP}
        onClick={() => choose(PICKUP)}
      >
        <StoreIcon width="15" height="15" />
        استلام
      </button>
    </div>
  );
}

/* ------------------------------------------------------------- open/closed */

function OpenState() {
  const current = useSelector((e) => e.Restaurant).data,
    hours = todaysHours(current);

  if (!hours) return null;

  return (
    <span
      className={"mt-open" + (hours.isOpen ? "" : " mt-open--shut")}
      title={hours.isOpen ? "الفرع مفتوح الآن" : "الفرع مغلق الآن"}
    >
      <ClockIcon width="15" height="15" />
      <b>{hours.isOpen ? "مفتوح الآن" : "مغلق"}</b>
      <span>
        {hours.open} — {hours.close}
      </span>
    </span>
  );
}

/* ------------------------------------------------------------------ search */

function SearchField() {
  const redirect = useNavigate(),
    [term, setTerm] = useState("");

  function submit(event) {
    event.preventDefault();
    const q = term.trim();
    redirect("/all-products" + (q ? "?q=" + encodeURIComponent(q) : ""));
  }

  return (
    <form className="mt-search" role="search" onSubmit={submit}>
      <SearchIcon width="17" height="17" />
      <input
        type="search"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        placeholder="ابحث عن تورتة، جاتوه، بيتيفور…"
        aria-label="ابحث في منتجات مونتانا"
      />
    </form>
  );
}

/* ----------------------------------------------------------------- actions */

function AlertsButton() {
  const unread = useSelector((e) => e.User).alerts.filter((a) => !a.is_read);

  return (
    <Link to="/alerts" className="mt-iconbtn" aria-label="الإشعارات">
      <BellIcon />
      {unread.length > 0 && (
        <span className="mt-iconbtn__badge">{unread.length}</span>
      )}
    </Link>
  );
}

function AccountMenu() {
  const { loaded } = useSelector((e) => e.User),
    [open, setOpen] = useState(false);

  if (!loaded) {
    return (
      <Link to="/user" className="mt-iconbtn" aria-label={getText(5)}>
        <UserIcon />
      </Link>
    );
  }

  return (
    <div className="mt-picker mt-picker--end">
      <button
        type="button"
        className="mt-iconbtn"
        aria-label={getText(3)}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <UserIcon />
      </button>

      {open && (
        <>
          <div className="mt-picker__scrim" onClick={() => setOpen(false)} />
          <ul className="mt-picker__list mt-picker__list--sm">
            <li>
              <Link to="/settings/addresses" onClick={() => setOpen(false)}>
                {getText(3)}
              </Link>
            </li>
            <li>
              <Link to="/settings/history" onClick={() => setOpen(false)}>
                طلباتي
              </Link>
            </li>
            <li>
              <button type="button" className="mt-danger" onClick={logout}>
                {getText(4)}
              </button>
            </li>
          </ul>
        </>
      )}
    </div>
  );
}

function CartButton() {
  const cart = useSelector((e) => e.Products).cart,
    counter = useRef(null);

  let count = 0,
    total = 0;

  cart.forEach((item) => {
    count += item.quantity;
    total += (item.totalPrice ?? item.price * item.quantity) || 0;
  });

  useEffect(() => {
    counter.current && counter.current.classList.add("animate");
  }, [count]);

  return (
    <Link to="/cart" className="mt-cart" aria-label={`السلة، ${count} صنف`}>
      <CartIcon width="18" height="18" />
      <span className="mt-cart__total">{total.toFixed(2)} ر.س</span>
      <span
        className="mt-cart__count"
        ref={counter}
        onAnimationEnd={(e) => e.target.classList.remove("animate")}
      >
        {count}
      </span>
    </Link>
  );
}

/* --------------------------------------------------------------- side menu */

function SideMenu({ open, onClose }) {
  const jobsEnabled = useFeature("jobs"),
    activeLang = getActiveLang();

  return (
    <div className={"mt-side" + (open ? " is-open" : "")} aria-hidden={!open}>
      <div className="mt-side__scrim" onClick={onClose} />

      <div className="mt-side__panel" role="dialog" aria-label={getText(5)}>
        <button type="button" className="mt-side__close" onClick={onClose}>
          إغلاق
        </button>

        <ul>
          <li>
            <Link to="/all-products" onClick={onClose}>
              {getText(6)}
            </Link>
          </li>
          <li>
            <Link to="/design" onClick={onClose}>
              صمم كيكتك بنفسك
            </Link>
          </li>
          <li>
            <Link to="/early-booking" onClick={onClose}>
              الحجز المبكر
            </Link>
          </li>
          <li>
            <Link to="/restaurant" onClick={onClose}>
              {getText(1)}
            </Link>
          </li>
          <li>
            <Link to="/settings" onClick={onClose}>
              {getText(5)}
            </Link>
          </li>
          {jobsEnabled && (
            <li>
              <Link to="/jobs" onClick={onClose}>
                {getText(2)}
              </Link>
            </li>
          )}
        </ul>

        <div className="mt-side__langs">
          <GlobeIcon width="16" height="16" />
          {keys.map((key) => (
            <button
              key={key}
              type="button"
              data-active={activeLang === key}
              onClick={() => changeLang(key)}
            >
              {key}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function changeLang(lang) {
  window.localStorage.setItem("lang", lang);
  window.location.reload();
}

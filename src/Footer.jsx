import getPage from "./translation.js";
import { Link } from "react-router-dom";
import call from "./icons/call.jsx";
import whatsapp from "./icons/whatsapp.jsx";

/* eslint-disable import/no-anonymous-default-export */

const getText = getPage("footer"),
  // Payment marks are the only images left pointing at a third party. They are
  // brand assets we cannot redraw, but they are lazy so they never hold up the
  // page, and a failure hides the mark rather than leaving a broken icon.
  payments = [
    { alt: "مدى", src: "https://www.msegat.com/_astro/mada.Bx07ek4T_17YVYh.svg" },
    { alt: "Visa", src: "https://www.msegat.com/_astro/visa.fN2z271z_Z1hHDKY.webp" },
    { alt: "Mastercard", src: "https://www.msegat.com/_astro/master-card.DOsJuDqG_Z1bPDkw.webp" },
    { alt: "Apple Pay", src: "https://www.msegat.com/_astro/apple-pay.Dg2YpybF_Z2pgIge.webp" },
    { alt: "STC Pay", src: "https://www.msegat.com/_astro/stc-pay.DkAsAmzl_1oFqQV.webp" },
    { alt: "سداد", src: "https://www.msegat.com/_astro/sadad.Dazq8A7k_Z1mB36r.webp" },
    { alt: "تحويل بنكي", src: "https://www.msegat.com/_astro/bank-transfer.C0oXorf9_Z2rVK1U.webp" },
  ];

export default function () {
  return (
    <div className="mt-foot">
      <div className="mt-foot__cols">
        <div className="mt-foot__brand">
          <img
            src={process.env.PUBLIC_URL + "/assets/home/logo-white.svg"}
            alt="حلويات مونتانا"
            width="130"
            height="49"
          />
          <p style={{ margin: 0 }}>{getText(0)}</p>
        </div>

        <div>
          <h2>{getText(1)}</h2>
          <ul>
            <li>
              <a href="tel:+966920035416">
                {call}
                <span style={{ fontVariantNumeric: "tabular-nums" }}>920035416</span>
              </a>
            </li>
            <li>
              <a href="https://wa.me/+966920035416">
                {whatsapp}
                <span style={{ fontVariantNumeric: "tabular-nums" }}>920035416</span>
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h2>{getText(8)}</h2>
          <ul>
            <li>
              <Link to="/about-us">{getText(2)}</Link>
            </li>
            <li>
              <Link to="/faq">{getText(3)}</Link>
            </li>
            <li>
              <Link to="/restaurant">الفروع</Link>
            </li>
            <li>
              <Link to="/privacy-policy">{getText(9)}</Link>
            </li>
          </ul>
        </div>

        <div>
          <h2>{getText(4)}</h2>
          {/* Text links rather than the official store badges: both badges were
              hotlinked from wikimedia/svgrepo and one of them already fails to
              load, which left a broken image in the footer of every page. */}
          <div className="mt-foot__store">
            <a
              href="https://play.google.com/store/apps/details?id=montana.sa"
              target="_blank"
              rel="noreferrer"
            >
              Google Play
            </a>
            <a
              href="https://apps.apple.com/us/app/%D8%AD%D9%84%D9%88%D9%8A%D8%A7%D8%AA-%D9%85%D9%88%D9%86%D8%AA%D8%A7%D9%86%D8%A7/id6755387336"
              target="_blank"
              rel="noreferrer"
            >
              App Store
            </a>
          </div>
        </div>
      </div>

      <div className="mt-foot__pay">
        {payments.map((p) => (
          <img
            key={p.alt}
            src={p.src}
            alt={p.alt}
            loading="lazy"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
        ))}
      </div>

      <div className="mt-foot__legal">
        <span>
          {getText(5)} <b>4030479174</b>
        </span>
        <span>
          {getText(6)} <b>311354802600003</b>
        </span>
        <span>
          {getText(7)} © 2003–2026 Montana — شركة كيكة بلس للحلويات
        </span>
      </div>
    </div>
  );
}

import getPage from "../translation";
import { Link } from "react-router-dom";
import "./about.scss";

const getText = getPage("about");

/**
 * The one page where the 1950 story earns its space. It was a justified wall of
 * text with no measure limit, which on a wide screen ran to well over 200
 * characters a line.
 */
export default function About() {
  return (
    <div className="mt-page mt-about">
      <header className="mt-page__head">
        <p className="mt-about__eyebrow">جدة · منذ ١٩٥٠</p>
        <h1>
          {getText(0)}
          {getText(1)}
        </h1>
      </header>

      <div className="mt-about__body">
        <p>{getText(2)}</p>
        <p>{getText(3)}</p>
        <p>{getText(4)}</p>
        <p>{getText(5)}</p>
      </div>

      <ul className="mt-about__stats">
        <li>
          <b>٧٥+</b>
          <span>سنة خبرة</span>
        </li>
        <li>
          <b>١٠</b>
          <span>فروع في جدة</span>
        </li>
        <li>
          <b>١٠٠٪</b>
          <span>صناعة سعودية</span>
        </li>
      </ul>

      <div className="mt-about__cta">
        <Link className="mt-btn mt-btn--primary" to="/all-products">
          تصفّح منتجاتنا
        </Link>
        <Link className="mt-btn mt-btn--ghost" to="/restaurant">
          فروعنا
        </Link>
      </div>
    </div>
  );
}

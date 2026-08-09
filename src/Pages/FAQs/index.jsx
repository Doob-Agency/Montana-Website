import getPage from "../../translation";
import faqs from "./data.json";
import "./index.scss";

const getText = getPage("faq");

/**
 * Built on <details>, so a question opens on keyboard and is findable with the
 * browser's own find-in-page. The previous accordion toggled a class from an
 * onClick on an <h5>, which neither keyboards nor Ctrl+F could reach.
 */
export default function () {
  return (
    <div className="mt-page mt-faq">
      <header className="mt-page__head">
        <h1>{getText(0)}</h1>
        <p>لم تجد إجابتك؟ اتصل بنا على 920035416</p>
      </header>

      <ul>
        {faqs.map(({ q, a }, i) => (
          <li key={i}>
            <details>
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          </li>
        ))}
      </ul>
    </div>
  );
}

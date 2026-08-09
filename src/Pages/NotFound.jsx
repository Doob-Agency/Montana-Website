import { Link } from "react-router-dom";

/**
 * A 404 that offers a way forward instead of a dead end. The previous one gave
 * a single link back to the homepage, which is rarely where the visitor was
 * trying to go.
 */
export default () => (
  <div className="mt-page">
    <div className="mt-empty" style={{ paddingBlock: "var(--mt-7)" }}>
      <p
        style={{
          fontSize: "clamp(3rem, 9vw, 5rem)",
          fontWeight: 800,
          color: "var(--mt-navy)",
          lineHeight: 1,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        404
      </p>
      <h2>هذه الصفحة غير موجودة</h2>
      <p>
        قد يكون الرابط قديماً أو الصنف لم يعد ضمن قائمة الفرع. جرّب البحث في
        المنتجات أو ابدأ من الرئيسية.
      </p>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "center" }}>
        <Link className="mt-btn mt-btn--primary" to="/all-products">
          تصفّح المنتجات
        </Link>
        <Link className="mt-btn mt-btn--ghost" to="/">
          الصفحة الرئيسية
        </Link>
      </div>
    </div>
  </div>
);

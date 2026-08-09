/* eslint-disable import/no-anonymous-default-export */
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import getPage from "../../../translation";
import ProductCard from "../../Home/ProductCard";

const getText = getPage("settings");

/**
 * A grid, not a carousel. Favourites are a list you scan and pick from, so
 * hiding all but three behind arrows was the wrong shape for it.
 */
export default function () {
  const favs = useSelector((state) => state.Products.fav);

  return (
    <div className="mt-tab">
      <div className="mt-tab__head">
        <h2>{getText(2)}</h2>
        {!!favs.length && <span className="mt-tab__count">{favs.length} صنف</span>}
      </div>

      {favs.length ? (
        <div className="mt-grid">
          {favs.map((item) => (
            <ProductCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="mt-empty">
          <h2>لا توجد أصناف في المفضلة</h2>
          <p>اضغط على القلب في أي صنف ليظهر هنا، فتصل إليه بسرعة في المرة القادمة.</p>
          <Link className="mt-btn mt-btn--dark" to="/all-products">
            تصفّح المنتجات
          </Link>
        </div>
      )}
    </div>
  );
}

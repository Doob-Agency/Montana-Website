/* eslint-disable import/no-anonymous-default-export */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import getPage from "../../../translation";

const getText = getPage("settings"),
  API = process.env.REACT_APP_API_URL + "/public/api/get-wallet-transactions";

export default function () {
  const [state, setState] = useState({ status: "loading", balance: 0, rows: [] });

  useEffect(() => {
    let alive = true;

    // The previous version called this from a useLayoutEffect with no dependency
    // array, so it refetched the wallet on every single render — an endless loop
    // of requests for as long as the tab was open.
    fetch(API, {
      method: "POST",
      body: JSON.stringify({}),
      headers: {
        "Content-Type": "application/json",
        Authorization: window.localStorage.getItem("token"),
      },
    })
      .then((r) => r.json())
      .then((r) => {
        if (!alive) return;
        setState({
          status: "ready",
          balance: +r.balance || 0,
          rows: Array.isArray(r.transactions) ? r.transactions : [],
        });
      })
      .catch(() => alive && setState((s) => ({ ...s, status: "error" })));

    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="mt-tab">
      <div className="mt-tab__head">
        <h2>{getText(3)}</h2>
      </div>

      <div className="mt-wallet-card">
        <span className="k">الرصيد الحالي</span>
        <b className="v">
          {state.status === "loading" ? (
            <span className="mt-skeleton" style={{ display: "inline-block", width: 110, height: 30 }} />
          ) : (
            <>
              {state.balance.toFixed(2)} <em>ر.س</em>
            </>
          )}
        </b>
        <p>يُخصم الرصيد تلقائياً من قيمة طلبك القادم.</p>
      </div>

      {state.status === "error" && (
        <p className="mt-tab__err">تعذّر تحميل بيانات المحفظة. حدّث الصفحة وحاول مرة أخرى.</p>
      )}

      {state.status === "ready" &&
        (state.rows.length ? (
          <div className="mt-tab__scroll">
            <table className="mt-table">
              <thead>
                <tr>
                  <th>التاريخ</th>
                  <th>البيان</th>
                  <th>المبلغ</th>
                </tr>
              </thead>
              <tbody>
                {state.rows.map((t, i) => {
                  const amount = +t.amount || 0,
                    credit = String(t.type || "").toLowerCase() !== "debit" && amount >= 0;
                  return (
                    <tr key={t.id || i}>
                      <td>{String(t.created_at || "").split(" ")[0]}</td>
                      <td>{t.meta?.name || t.description || t.type || "—"}</td>
                      <td className={credit ? "is-credit" : "is-debit"}>
                        {credit ? "+" : "−"} {Math.abs(amount).toFixed(2)} ر.س
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="mt-empty">
            <h2>لا توجد حركات بعد</h2>
            <p>
              سيظهر هنا كل استرداد نقدي أو شحن للمحفظة. اطلب الآن لتبدأ في جمع
              الكاش باك.
            </p>
            <Link className="mt-btn mt-btn--dark" to="/all-products">
              تصفّح المنتجات
            </Link>
          </div>
        ))}
    </div>
  );
}

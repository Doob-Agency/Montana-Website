/* eslint-disable import/no-anonymous-default-export */
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import getPage from "../../../translation";
import NewAddress from "../NewAddress";

const getText = getPage("settings"),
  API = process.env.REACT_APP_API_URL + "/public/api";

export default function () {
  const { data, addresses } = useSelector((e) => e.User),
    dispatch = useDispatch(),
    [showNew, setShowNew] = useState(false),
    [busyId, setBusyId] = useState(null);

  function remove(id) {
    setBusyId(id);
    fetch(API + "/delete-address", {
      method: "POST",
      body: JSON.stringify({ address_id: id }),
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + data.auth_token,
      },
    })
      .then((r) => r.json())
      .then((r) => dispatch({ type: "user/setAddresses", payload: r }))
      .finally(() => setBusyId(null));
  }

  return (
    <div className="mt-tab">
      <div className="mt-tab__head">
        <h2>{getText(6)}</h2>
        <button type="button" className="mt-btn mt-btn--dark" onClick={() => setShowNew(true)}>
          {getText(7)}
        </button>
      </div>

      {addresses.length ? (
        <ul className="mt-addr">
          {addresses.map((a) => (
            <li key={a.id || a.created_at}>
              <div>
                <b>{a.tag}</b>
                <p>
                  {[a.house, a.address, a.landmark].filter(Boolean).join("، ")}
                </p>
              </div>

              <button
                type="button"
                onClick={() => remove(a.id)}
                disabled={busyId === a.id}
                aria-label={`احذف عنوان ${a.tag}`}
              >
                {busyId === a.id ? "..." : getText(8)}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-empty">
          <h2>لا توجد عناوين محفوظة</h2>
          <p>أضف عنوانك ليظهر مباشرة عند إتمام الطلب بدل كتابته كل مرة.</p>
          <button type="button" className="mt-btn mt-btn--primary" onClick={() => setShowNew(true)}>
            {getText(7)}
          </button>
        </div>
      )}

      <NewAddress isActive={showNew} deActivate={() => setShowNew(false)} />
    </div>
  );
}

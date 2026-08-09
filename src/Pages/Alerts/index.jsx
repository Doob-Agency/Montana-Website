import { useSelector } from "react-redux";
import { getUserAlerts } from "../../store";
import { Link, useNavigate } from "react-router-dom";
import { useLayoutEffect } from "react";
import getPage from "../../translation.js";
import "./index.scss";

const getText = getPage("alerts");

const base = process.env.REACT_APP_API_URL,
  baseUrl = base + "/public/api",
  fetchOptions = {
    method: "POST",
    get headers() {
      const obj = { "Content-Type": "application/json" },
        token = localStorage.getItem("token");
      return token ? { ...obj, Authorization: token } : obj;
    },
  };

export default function Alerts() {
  const redirect = useNavigate(),
    loaded = window.localStorage.getItem("token"),
    alerts = useSelector((state) => state.User).alerts;

  useLayoutEffect(() => {
    loaded || redirect("/user");
  }, [loaded, redirect]);

  const unread = alerts.filter((a) => !a.is_read).length;

  return (
    <div className="mt-page mt-alerts">
      <header className="mt-page__head">
        <h1>الإشعارات</h1>
        <p>{unread ? `${unread} غير مقروء` : "لا يوجد جديد"}</p>
      </header>

      {alerts.length ? (
        <>
          {unread > 0 && (
            <button type="button" className="mt-btn mt-btn--ghost mt-alerts__all" onClick={markAllAsRead}>
              {getText(0)}
            </button>
          )}

          <ul>{alerts.map(alertItem)}</ul>
        </>
      ) : (
        <div className="mt-empty">
          <h2>لا توجد إشعارات</h2>
          <p>
            سيظهر هنا كل ما يخص طلباتك — تأكيد الطلب، خروجه للتوصيل، والعروض
            الخاصة بك.
          </p>
          <Link className="mt-btn mt-btn--dark" to="/all-products">
            تصفّح المنتجات
          </Link>
        </div>
      )}
    </div>
  );
}

function alertItem({ data, id, is_read, created_at }) {
  // A malformed row used to throw here and blank the whole page.
  let parsed;
  try {
    parsed = JSON.parse(data);
  } catch {
    return null;
  }

  const reqBody = { notification_id: id },
    body = (
      <>
        <span className="mt-alert__date">{String(created_at).split(" ")[0]}</span>
        <b className="mt-alert__title">{parsed.title}</b>
        <p className="mt-alert__msg">{parsed.message}</p>
      </>
    );

  return (
    <li key={id} className={"mt-alert" + (is_read ? " is-read" : "")} onClick={markAlertAsRead}>
      {parsed.custom_image && (
        <img src={base + parsed.custom_image} alt="" loading="lazy" />
      )}

      {parsed.click_action ? (
        <Link to={parsed.click_action}>{body}</Link>
      ) : (
        <div>{body}</div>
      )}
    </li>
  );

  function markAlertAsRead() {
    if (is_read) return;
    fetch(`${baseUrl}/mark-one-notification-read`, {
      ...fetchOptions,
      body: JSON.stringify(reqBody),
    }).then(getUserAlerts);
  }
}

function markAllAsRead() {
  fetch(`${baseUrl}/mark-all-notifications-read`, fetchOptions).then(getUserAlerts);
}

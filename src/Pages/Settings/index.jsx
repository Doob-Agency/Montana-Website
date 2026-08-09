/**
 * Account — direction B.
 *
 * One responsive shell instead of two. There used to be a desktop shell and a
 * mobile shell that cross-imported each other's tabs (desktop pulled wallet and
 * account from mobile, mobile pulled addresses and history from desktop), plus
 * a mobile-only landing grid of six tiles. Every change had to be made twice
 * and one copy usually drifted — the mobile address list, for instance, had no
 * delete button and was dead code besides.
 *
 * Here the navigation is a sidebar on desktop and a scrollable rail on phones,
 * and there is exactly one implementation of each tab.
 */
/* eslint-disable import/no-anonymous-default-export */
import { useLayoutEffect } from "react";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import getPage, { keys, getActiveLang } from "../../translation";
import { logout } from "../../store";
import tabs from "./tabs";
import "./index.scss";

const getText = getPage("settings");

const NAV = [
  { key: "history", label: 1 },
  { key: "addresses", label: 0 },
  { key: "wallet", label: 3 },
  { key: "fav", label: 2 },
  { key: "account", label: 4 },
];

export default function () {
  const navigate = useNavigate(),
    isAuthed = window.localStorage.getItem("token"),
    tabName = useParams().tab || "history",
    TargetTab = tabs[tabName] || tabs.history,
    { name, phone } = useSelector((e) => e.User).data;

  useLayoutEffect(() => {
    isAuthed || navigate("/user/login");
  }, [isAuthed, navigate]);

  if (!isAuthed) return null;

  const activeLang = getActiveLang();

  return (
    <div className="mt-page mt-account">
      <header className="mt-page__head">
        <h1>حسابي</h1>
        <p>
          {name || "—"}
          {phone ? ` · ${phone}` : ""}
        </p>
      </header>

      <div className="mt-account__grid">
        <nav className="mt-account__nav" aria-label="أقسام الحساب">
          <ul>
            {NAV.map(({ key, label }) => (
              <li key={key}>
                <NavLink to={"/settings/" + key}>{getText(label)}</NavLink>
              </li>
            ))}
          </ul>

          <div className="mt-account__foot">
            <div className="mt-account__langs">
              {keys.map((k) => (
                <button
                  key={k}
                  type="button"
                  data-active={activeLang === k}
                  onClick={() => changeLang(k)}
                >
                  {k}
                </button>
              ))}
            </div>

            <button type="button" className="mt-account__logout" onClick={logout}>
              {getText(5)}
            </button>
          </div>
        </nav>

        <section className="mt-account__panel">
          <TargetTab />
        </section>
      </div>
    </div>
  );
}

function changeLang(lang) {
  window.localStorage.setItem("lang", lang);
  window.location.reload();
}

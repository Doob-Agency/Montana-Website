import { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { hardRedirect } from "../basePath.js";

/**
 * MyFatoorah serves the embedded-payment script from a different host per
 * environment, and a session created on one is invisible to the other. Hand a
 * live SessionId to the demo script — or a test one to the live script — and it
 * renders "Sorry something went wrong! Please contact system administrator."
 * where the card form should be.
 *
 * The host used to be a hardcoded <script> tag in index.html, so it silently
 * stopped matching the moment myFatooraMode was switched in the dashboard. It is
 * now taken from that very setting, the same one the backend builds the session
 * with, so the two cannot drift apart again.
 */
const SCRIPT_HOST = {
  live: "https://sa.myfatoorah.com",
  test: "https://demo.myfatoorah.com",
};

function loadMyFatoorah(mode) {
  const src = `${SCRIPT_HOST[mode]}/sessions/v1/session.js`,
    existing = document.querySelector("script[data-myfatoorah]");

  if (existing) {
    if (existing.src === src) return Promise.resolve();
    // the mode changed while the tab was open — the loaded script answers for
    // the wrong environment, so replace it rather than stack a second one on top
    existing.remove();
    delete window.myfatoorah;
  }

  return new Promise((resolve, reject) => {
    const el = document.createElement("script");
    el.src = src;
    el.async = true;
    el.dataset.myfatoorah = mode;
    el.onload = resolve;
    el.onerror = () => reject(new Error(`could not load ${src}`));
    document.head.appendChild(el);
  });
}

export default function () {
  const initiated = useRef(false),
    settings = useSelector((e) => e.settings).data,
    // Settings arrive asynchronously. Reading the mode before they land would
    // lock in the wrong environment, so wait for them.
    ready = settings && Object.keys(settings).length > 0,
    mode = settings && settings.myFatooraMode === "live" ? "live" : "test";

  useEffect(() => {
    if (!ready || initiated.current) return;
    initiated.current = true;

    loadMyFatoorah(mode)
      .then(initPaymentForm)
      .catch((e) => console.error("MyFatoorah:", e.message));
  }, [ready, mode]);

  return (
    <section className="container" style={{ maxWidth: "750px" }}>
      <div id="embedded-sessions"></div>
    </section>
  );
}

const config = {
  // Add the "SessionId" you received from POST Session Endpoint.
  // sessionId: "KWT-68814db6-7510-4005-ada9-408aae9f373c",

  // MyFatoorah triggers this callback after the customer completes payment, either by submitting card details, finishing Google Pay / Apple Pay / STC Pay, or choosing any hosted payment method.
  // callback: payment,

  //Enter the div id you created in previous step.
  containerId: "embedded-sessions",

  // Default true
  shouldHandlePaymentUrl: true,
};

function initPaymentForm() {
  const reqURL = new URLSearchParams(window.location.search);

  window.myfatoorah.init({
    ...config,
    sessionId: reqURL.get("sessionId"),
    callback(res) {
      if (res.isSuccess) {
        hardRedirect(
          `/invoice/${reqURL.get("orderId")}?paymentId=${extractPaymentId(res)}&sessionId=${reqURL.get("sessionId")}`,
        );
      }
    },
  });
}

function extractPaymentId(res) {
  const url = new URL(res.redirectionUrl);
  return url.searchParams.get("paymentId");
}

import { useEffect, useRef, useState } from "react";
import { useStore } from "react-redux";

export default function () {
  const initiated = useRef(false);
  const store = useStore();
  const [error, setError] = useState(null);

  useEffect(() => {
    if (initiated.current) return;
    initiated.current = true;

    const reqURL = new URLSearchParams(window.location.search);
    const sessionId = reqURL.get("sessionId");
    const isMoyasar = sessionId && sessionId.startsWith("MSR-");

    if (isMoyasar) {
      loadMoyasarSDK()
        .then(() => initMoyasarForm(reqURL, store.getState().settings.data))
        .catch((err) => {
          console.error("[Moyasar]", err);
          setError("فشل تحميل بوابة الدفع، يرجى المحاولة مرة أخرى.");
        });
    } else {
      try {
        initMyFatoorahForm(reqURL);
      } catch (err) {
        console.error("[MyFatoorah]", err);
        setError("فشل تحميل بوابة الدفع، يرجى المحاولة مرة أخرى.");
      }
    }
  }, []);

  if (error) {
    return (
      <section className="container text-center py-5" style={{ maxWidth: "750px" }}>
        <p className="text-danger fw-bold">{error}</p>
        <button className="btn mt-2" style={{ background: "var(--primary)", color: "#fff", borderRadius: 24 }}
          onClick={() => window.history.back()}>
          العودة
        </button>
      </section>
    );
  }

  return (
    <section className="container" style={{ maxWidth: "750px" }}>
      <div id="embedded-sessions"></div>
      <div className="mysr-form"></div>
    </section>
  );
}

function loadMoyasarSDK() {
  if (window.Moyasar) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://cdn.moyasar.com/mpf/1.9.0/moyasar.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://cdn.moyasar.com/mpf/1.9.0/moyasar.js";
    script.onload = () => {
      if (!window.Moyasar) {
        reject(new Error("Moyasar SDK loaded but window.Moyasar is undefined"));
        return;
      }
      resolve();
    };
    script.onerror = () => reject(new Error("Failed to load Moyasar SDK from CDN"));
    document.body.appendChild(script);
  });
}

function initMyFatoorahForm(reqURL) {
  window.myfatoorah.init({
    containerId: "embedded-sessions",
    shouldHandlePaymentUrl: true,
    sessionId: reqURL.get("sessionId"),
    callback(res) {
      if (res.isSuccess) {
        const paymentId = new URL(res.redirectionUrl).searchParams.get("paymentId");
        window.location.href =
          `/invoice/${reqURL.get("orderId")}?paymentId=${paymentId}&sessionId=${reqURL.get("sessionId")}`;
      }
    },
  });
}

function initMoyasarForm(reqURL, settings) {
  const token = reqURL.get("sessionId");
  const stored = JSON.parse(sessionStorage.getItem(token) || "{}");
  sessionStorage.removeItem(token);
  const orderId = stored.orderId;
  const amount = parseFloat(stored.amount) || 0;

  // Apple Pay - Domains flow: Moyasar handles merchant validation via their hosted endpoint
  // (domain must be registered in Moyasar dashboard → Settings → Apple Pay - Domains).
  const applePayValidateUrl =
    settings?.moyasarApplePayValidateUrl ||
    process.env.REACT_APP_MOYASAR_APPLEPAY_VALIDATE_URL ||
    "https://api.moyasar.com/v1/applepay/initiate";

  const backendKey = settings?.moyasarPublishableKey;
  const envKey = process.env.REACT_APP_MOYASAR_PUBLISHABLE_KEY;
  const publishableKey = backendKey || envKey || "";
  const keySource = backendKey ? "backend" : envKey ? ".env fallback" : "NONE";

  const config = {
    element: ".mysr-form",
    amount: Math.round(amount * 100),
    currency: "SAR",
    description: `Order #${orderId}`,
    publishable_api_key: publishableKey,
    callback_url: `${window.location.origin}/invoice/${orderId}?gateway=moyasar`,
    methods: ["creditcard", "applepay"],
    apple_pay: {
      country: settings?.moyasarApplePayCountry || process.env.REACT_APP_MOYASAR_APPLEPAY_COUNTRY || "SA",
      label: settings?.siteName || "Montana",
      validate_merchant_url: applePayValidateUrl,
    },
  };

  console.log(
    "[Moyasar] key source:", keySource,
    "| prefix:", publishableKey.slice(0, 8),
    "| mode:", publishableKey.startsWith("pk_live_") ? "LIVE" : publishableKey.startsWith("pk_test_") ? "TEST" : "INVALID"
  );
  console.log("[Moyasar] init config:", config);
  window.Moyasar.init(config);
}

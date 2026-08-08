const observers = [];

let lang = "العربية",
  keys,
  file;

async function initLangs(callback) {
  const activeLang = window.localStorage.getItem("lang"),
    langsMap = await fetch(process.env.PUBLIC_URL + "/assets/languages/map.json", {
      method: "GET",
    }).then((r) => r.json());

  keys = Object.keys(langsMap);
  activeLang && (lang = activeLang);

  file = await fetch(process.env.PUBLIC_URL + "/assets/languages/" + langsMap[lang]).then((r) =>
    r.json(),
  );

  // index.html ships as ar/rtl; correct the root element too when the visitor
  // has picked English, so screen readers and hyphenation follow the content.
  const isArabic = lang === "العربية";
  document.documentElement.lang = isArabic ? "ar" : "en";
  document.documentElement.dir = document.body.dir = isArabic ? "rtl" : "ltr";

  window.localStorage.setItem("lang", lang);
  observers.forEach((o) => o());
  callback();
}

export { keys, initLangs, observeLang, getActiveLang, inlineArEn };

export default function getPage(pageName) {
  return function (phraseIndex) {
    try {
      return file[pageName][phraseIndex];
    } catch {
      debugger;
    }
  };
}

function getActiveLang() {
  return window.localStorage.getItem("lang") || lang;
}

function observeLang(observer) {
  observers.push(observer);
}

function inlineArEn(arabic, english) {
  return lang === "العربية" ? arabic : english;
}
window.dataLayer = window.dataLayer || [];
window.gtag = window.gtag || function gtag() {
  window.dataLayer.push(arguments);
};
window.gtag("js", new Date());
window.gtag("config", "G-4Z414XJ7GJ", { anonymize_ip: true });

function loadAnalytics() {
  const analyticsScript = document.createElement("script");
  analyticsScript.async = true;
  analyticsScript.src = "https://www.googletagmanager.com/gtag/js?id=G-4Z414XJ7GJ";
  document.head.appendChild(analyticsScript);
}

// Queue page views immediately; download tracking after the page has loaded.
if (document.readyState === "complete") {
  loadAnalytics();
} else {
  window.addEventListener("load", loadAnalytics, { once: true });
}

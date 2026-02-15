// Fade-in sections on scroll
const observer = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (e.isIntersecting) e.target.classList.add("in-view");
  }
}, { threshold: 0.12 });

document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

function getLocIdFromUrl() {
  // /locations/<id>/  (or /locations/<id>)
  const m = window.location.pathname.match(/\/locations\/([^\/?#]+)\/?$/);
  if (m) return decodeURIComponent(m[1]);

  // /locations/?loc=<id>
  const sp = new URLSearchParams(window.location.search);
  const q = sp.get("loc");
  return q ? q : null;
}

function buildLocationUrl(locId) {
  const prefix =
    (typeof window.LOCATION_DETAIL_PREFIX === "string" && window.LOCATION_DETAIL_PREFIX) ||
    "/locations/";
  const base = prefix.endsWith("/") ? prefix : `${prefix}/`;
  return `${base}${encodeURIComponent(locId)}/`;
}

function setUrlForLocation(locId, { replace = false } = {}) {
  const url = buildLocationUrl(locId);
  const method = replace ? "replaceState" : "pushState";
  if (window.history && window.history[method]) {
    window.history[method]({ locId }, "", url);
  } else {
    // fallback
    window.location.hash = locId;
  }
}

function setUrlForChooser({ replace = false } = {}) {
  const prefix =
    (typeof window.LOCATION_DETAIL_PREFIX === "string" && window.LOCATION_DETAIL_PREFIX) ||
    "/locations/";
  const url = prefix.endsWith("/") ? prefix : `${prefix}/`;
  const method = replace ? "replaceState" : "pushState";
  if (window.history && window.history[method]) {
    window.history[method]({}, "", url);
  } else {
    window.location.hash = "";
  }
}

function showLocation(locId, opts = {}) {
  const chooser = document.getElementById("loc-chooser");
  const detailsWrap = document.getElementById("loc-details-wrap");

  if (!chooser || !detailsWrap) return;

  const { push = true, replace = false } = opts;

  // Update URL first so refresh loads this selection
  if (push) setUrlForLocation(locId, { replace });

  // If already on details view, just swap panels (no fade transition)
  if (detailsWrap.style.display === "block") {
    document.querySelectorAll(".loc-details").forEach((d) => (d.style.display = "none"));
    const chosen = document.getElementById(`details-${locId}`);
    if (chosen) chosen.style.display = "block";
    return;
  }

  chooser.classList.add("is-hidden");
  setTimeout(() => {
    chooser.style.display = "none";
    detailsWrap.style.display = "block";

    document.querySelectorAll(".loc-details").forEach((d) => (d.style.display = "none"));
    const chosen = document.getElementById(`details-${locId}`);
    if (chosen) chosen.style.display = "block";

    requestAnimationFrame(() => detailsWrap.classList.add("is-visible"));
  }, 260);
}

function resetChooser(opts = {}) {
  const chooser = document.getElementById("loc-chooser");
  const detailsWrap = document.getElementById("loc-details-wrap");

  if (!chooser || !detailsWrap) return;

  const { push = true, replace = false } = opts;

  if (push) setUrlForChooser({ replace });

  // If already on chooser, nothing else to do
  if (chooser.style.display === "grid") return;

  detailsWrap.classList.remove("is-visible");
  setTimeout(() => {
    detailsWrap.style.display = "none";
    chooser.style.display = "grid";
    chooser.classList.remove("is-hidden");
    requestAnimationFrame(() => chooser.classList.add("is-visible"));
  }, 260);
}


document.addEventListener("DOMContentLoaded", () => {
  const hasLocUI =
    document.getElementById("loc-chooser") || document.getElementById("loc-details-wrap");
  const isLocationsPath = window.location.pathname.startsWith("/locations");

  // Do not touch the URL on pages that are not locations-related
  if (!hasLocUI && !isLocationsPath) return;

  const initId =
    (typeof window.INIT_LOCATION_ID === "string" && window.INIT_LOCATION_ID.trim()) ||
    getLocIdFromUrl() ||
    (typeof window.location.hash === "string" &&
      window.location.hash.startsWith("#") &&
      window.location.hash.slice(1));

  if (initId) {
    const chosen = document.getElementById(`details-${initId}`);
    if (chosen) {
      // Seed state so back/forward works predictably
      setUrlForLocation(initId, { replace: true });
      showLocation(initId, { push: false });
      return;
    }
  }

  // Ensure chooser URL is canonical (locations page only)
  setUrlForChooser({ replace: true });
});

window.addEventListener("popstate", () => {
  const hasLocUI =
    document.getElementById("loc-chooser") || document.getElementById("loc-details-wrap");
  const isLocationsPath = window.location.pathname.startsWith("/locations");

  // Do not handle history navigation on non-locations pages
  if (!hasLocUI && !isLocationsPath) return;

  const stateId = window.history.state && window.history.state.locId;
  const locId = stateId || getLocIdFromUrl();

  if (locId) {
    const chosen = document.getElementById(`details-${locId}`);
    if (chosen) {
      showLocation(locId, { push: false });
      return;
    }
  }

  resetChooser({ push: false });
});


window.showLocation = showLocation;
window.resetChooser = resetChooser;

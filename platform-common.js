export function initMobileNav(toggleId = "menuToggle", navId = "primaryNav") {
  const toggle = document.getElementById(toggleId);
  const nav = document.getElementById(navId);
  if (!toggle || !nav) {
    return;
  }

  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
}

export function initReveal(selector = "[data-reveal]") {
  const reveals = document.querySelectorAll(selector);
  if (!reveals.length) {
    return;
  }

  if (!("IntersectionObserver" in window)) {
    reveals.forEach((item) => item.classList.add("revealed"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("revealed");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  reveals.forEach((item) => observer.observe(item));
}

export function setCurrentYear(id = "yearNow") {
  const yearEl = document.getElementById(id);
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }
}

export function markActiveNav(pageName) {
  const nav = document.getElementById("primaryNav");
  if (!nav) {
    return;
  }

  nav.querySelectorAll("a").forEach((link) => {
    const key = link.getAttribute("data-page");
    if (key === pageName) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });
}

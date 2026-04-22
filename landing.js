import { initMobileNav, initReveal, markActiveNav, setCurrentYear } from "./platform-common.js";

initMobileNav();
markActiveNav("home");

const faqButtons = document.querySelectorAll(".faq-question");
faqButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const targetId = button.getAttribute("aria-controls");
    const panel = targetId ? document.getElementById(targetId) : null;
    if (!panel) {
      return;
    }

    const isExpanded = button.getAttribute("aria-expanded") === "true";
    button.setAttribute("aria-expanded", String(!isExpanded));
    panel.hidden = isExpanded;
  });
});

initReveal();
setCurrentYear();

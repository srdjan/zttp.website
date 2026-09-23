// Keep the document in its usable no-JavaScript state until this controller
// has actually loaded. A blocked script must not expose inert controls.
document.documentElement.classList.replace("no-js", "js");

// Menu toggle: the button opens/closes the menu; a link click, Escape, or a
// click outside `outsideSelector` closes it.
function initMenuToggle(button, links, outsideSelector) {
  if (!button || !links) return;

  const setMenuState = (open) => {
    links.classList.toggle("open", open);
    button.setAttribute("aria-expanded", String(open));
  };

  button.addEventListener("click", () => {
    setMenuState(!links.classList.contains("open"));
  });
  links.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setMenuState(false));
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && links.classList.contains("open")) {
      setMenuState(false);
    }
  });
  document.addEventListener("click", (e) => {
    if (
      links.classList.contains("open") && !e.target.closest(outsideSelector)
    ) {
      setMenuState(false);
    }
  });
}

// Landing page nav menu.
initMenuToggle(
  document.querySelector(".z-menu-button"),
  document.querySelector(".z-nav-links"),
  ".z-nav",
);

// Install command copy affordance. The command appears twice on the homepage:
// once in the hero for visitors who arrive decided, once in the final CTA where
// the nav Install link lands. Both cards are wired from the same markup shape.
document.querySelectorAll(".z-install-card").forEach((card) => {
  const button = card.querySelector("button");
  const code = card.querySelector("code");
  if (!button || !code) return;

  const originalText = button.textContent;

  button.addEventListener("click", async () => {
    const command = (code.dataset.command || code.textContent)
      .replace(/\s+/g, " ")
      .trim();
    try {
      await navigator.clipboard.writeText(command);
      button.textContent = "Copied";
    } catch {
      globalThis.prompt("Copy install command", command);
      button.textContent = "Copy";
    }

    setTimeout(() => {
      button.textContent = originalText;
    }, 1500);
  });
});

// Scroll spy for active nav indicator
const spyLinks = document.querySelectorAll('.z-nav-links a[href^="#"]');
const spySections = [...spyLinks].map((link) =>
  document.querySelector(link.getAttribute("href"))
).filter(Boolean);

if (spySections.length && "IntersectionObserver" in globalThis) {
  const linkForId = new Map();
  spyLinks.forEach((link) => {
    const id = link.getAttribute("href").slice(1);
    if (!linkForId.has(id)) linkForId.set(id, link);
  });
  // A section is current while it crosses a thin line at the middle of the
  // viewport. A ratio threshold would never fire for a section taller than
  // the band, and a band that starts at the header still catches the tail of
  // the previous section after an anchor jump. When several sections cross the
  // line, the one whose link comes first in the nav wins; when none does, no
  // link is active.
  const inBand = new Set();
  // This is an optional indicator, so contain its failure rather than let it
  // surface as an uncaught error.
  try {
    const scrollSpy = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) inBand.add(entry.target);
          else inBand.delete(entry.target);
        });
        const current = spySections.find((section) => inBand.has(section));
        spyLinks.forEach((link) => link.classList.remove("active"));
        if (current) linkForId.get(current.id)?.classList.add("active");
      },
      {
        threshold: 0,
        rootMargin: "-50% 0px -49% 0px",
      },
    );
    spySections.forEach((section) => scrollSpy.observe(section));
  } catch (err) {
    console.error("script: scroll spy unavailable", err);
  }
}

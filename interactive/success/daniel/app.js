(() => {
  const book = document.getElementById("book");
  const pages = Array.from(document.querySelectorAll(".page"));
  const pageLabel = document.getElementById("pageLabel");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");

  const coverEl = document.getElementById("cover");
  let currentIndex = 0;

  const totalPages = pages.length;
  function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

  function updateNav() {
    if (pageLabel) pageLabel.textContent = `${currentIndex + 1} / ${totalPages}`;
    if (prevBtn) prevBtn.disabled = currentIndex <= 0;
    if (nextBtn) nextBtn.disabled = currentIndex >= totalPages - 1;
  }

  function setActive(idx) {
    currentIndex = clamp(idx, 0, totalPages - 1);
    pages.forEach(p => p.classList.remove("active"));
    const active = pages[currentIndex];
    if (active) active.classList.add("active");
    if (active) active.scrollTop = 0;
    updateNav();
  }

  function dismissCoverIfLeaving() {
    if (!coverEl) return;
    if (currentIndex > 0) coverEl.classList.add("dismissed");
    else coverEl.classList.remove("dismissed");
  }

  function goNext() {
    if (currentIndex < totalPages - 1) {
      setActive(currentIndex + 1);
      dismissCoverIfLeaving();
    }
  }

  function goPrev() {
    if (currentIndex > 0) {
      setActive(currentIndex - 1);
      dismissCoverIfLeaving();
    }
  }

  if (prevBtn) prevBtn.addEventListener("click", goPrev);
  if (nextBtn) nextBtn.addEventListener("click", goNext);

  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    const action = btn.getAttribute("data-action");
    if (action === "start") {
      setActive(1);
      dismissCoverIfLeaving();
      return;
    }
    if (action === "restart") {
      setActive(0);
      dismissCoverIfLeaving();
      return;
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") { e.preventDefault(); goNext(); }
    if (e.key === "ArrowLeft") { e.preventDefault(); goPrev(); }
  });

  setActive(0);
  dismissCoverIfLeaving();
})();

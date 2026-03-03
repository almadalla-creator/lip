(() => {
  const book = document.getElementById("book");
  const pagesEl = document.getElementById("pages");
  const pages = Array.from(document.querySelectorAll(".page"));
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const pageLabel = document.getElementById("pageLabel");

  if (!book || !pagesEl || pages.length === 0) return;

  let index = Math.max(0, pages.findIndex(p => p.classList.contains("active")));
  if (index < 0) index = 0;

  function clamp(n, min, max){ return Math.max(min, Math.min(max, n)); }

  function setActive(newIndex){
    index = clamp(newIndex, 0, pages.length - 1);
    pages.forEach((p, i) => p.classList.toggle("active", i === index));

    // Update label as 1-based count
    if (pageLabel) pageLabel.textContent = `${index + 1} / ${pages.length}`;

    // Enable/disable buttons
    if (prevBtn) prevBtn.disabled = index === 0;
    if (nextBtn) nextBtn.disabled = index === pages.length - 1;

    // Ensure scroll resets per page
    const inner = pages[index].querySelector(".pageInner");
    if (inner) inner.scrollTop = 0;
  }

  function next(){ setActive(index + 1); }
  function prev(){ setActive(index - 1); }
  function goToId(id){
    const i = pages.findIndex(p => p.id === id);
    if (i >= 0) setActive(i);
  }

  // Nav buttons
  prevBtn?.addEventListener("click", prev);
  nextBtn?.addEventListener("click", next);

  // Delegate actions (start/restart + optional goto)
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("button, a");
    if (!btn) return;

    const action = btn.getAttribute("data-action");
    if (action === "start"){
      // cover -> first story page (index 1)
      setActive(1);
      return;
    }
    if (action === "restart"){
      setActive(0);
      return;
    }

    const goto = btn.getAttribute("data-goto");
    if (goto){
      e.preventDefault();
      goToId(goto);
      return;
    }
  });

  // Keyboard navigation
  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") next();
    if (e.key === "ArrowLeft") prev();
  });

  // Touch: simple swipe left/right inside the book
  let touchX = null;
  book.addEventListener("touchstart", (e) => {
    touchX = e.changedTouches?.[0]?.clientX ?? null;
  }, {passive:true});

  book.addEventListener("touchend", (e) => {
    if (touchX === null) return;
    const endX = e.changedTouches?.[0]?.clientX ?? null;
    if (endX === null) return;
    const dx = endX - touchX;
    // Ignore small moves
    if (Math.abs(dx) < 50) return;
    if (dx < 0) next();
    else prev();
    touchX = null;
  }, {passive:true});

  // Init
  setActive(index);
})();

console.log("scripts loaded");

const yearNode = document.querySelector(".year");
if (yearNode) {
  yearNode.innerText = new Date().getFullYear().toString();
}

// Entry animations: card drop into hero, then reveal content
window.addEventListener("load", () => {
  const hero = document.querySelector(".hero");
  const main = document.querySelector("main");
  if (!hero || !main) return;

  const prefersReduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReduce) {
    main.classList.add("content-ready");
    return;
  }

  hero.classList.add("card-drop");
  setTimeout(() => {
    main.classList.add("content-ready");
  }, 700);
});

let isMobileNav = false;

function onResize() {
  const detailsElement = document.querySelector("#details"),
    mainContentElement = document.querySelector("#main-content"),
    isDetailsHidden = detailsElement.classList.contains(HIDDEN_CLASS),
    runnerContainer = document.querySelector(".runner-container");

  const isMobileScreen = window.matchMedia(
    "(min-width: 240px) and (max-width: 420px) and (min-height: 401px), (max-height: 560px) and (min-height: 240px) and (min-width: 421px)",
  ).matches;

  if (isMobileNav !== isMobileScreen) {
    isMobileNav = isMobileScreen;

    if (isMobileNav) {
      mainContentElement.classList.toggle(HIDDEN_CLASS, !isDetailsHidden);
      detailsElement.classList.toggle(HIDDEN_CLASS, isDetailsHidden);
      runnerContainer &&
        runnerContainer.classList.toggle(HIDDEN_CLASS, !isDetailsHidden);
    } else if (!isDetailsHidden) {
      mainContentElement.classList.remove(HIDDEN_CLASS);
      detailsElement.classList.remove(HIDDEN_CLASS);
      runnerContainer && runnerContainer.classList.remove(HIDDEN_CLASS);
    }
  }
}

function setupMobileNav() {
  window.addEventListener("resize", onResize);
  onResize();
}

document.addEventListener("DOMContentLoaded", setupMobileNav);

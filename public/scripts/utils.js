var errorPageController;
const HIDDEN_CLASS = "hidden";

function decodeUTF16Base64ToString(base64String) {
  const binaryString = atob(base64String);
  let decodedString = "";
  for (let i = 0; i < binaryString.length; i += 2) {
    decodedString += String.fromCharCode(
      256 * binaryString.charCodeAt(i) + binaryString.charCodeAt(i + 1),
    );
  }
  return decodedString;
}

function toggleHelpBox() {
  const detailsElement = document.getElementById("details");
  detailsElement.classList.toggle(HIDDEN_CLASS);
  const detailsButton = document.getElementById("details-button");

  if (detailsElement.classList.contains(HIDDEN_CLASS)) {
    detailsButton.innerText = detailsButton.detailsText;
  } else {
    detailsButton.innerText = detailsButton.hideDetailsText;
  }

  if (mobileNav) {
    document.getElementById("main-content").classList.toggle(HIDDEN_CLASS);
    const runnerContainer = document.querySelector(".runner-container");
    runnerContainer && runnerContainer.classList.toggle(HIDDEN_CLASS);
  }
}

function diagnoseErrors() {
  if (window.errorPageController) {
    errorPageController.diagnoseErrorsButtonClick();
  }
}

let isSubFrame = false;

function updateForDnsProbe(data) {
  const jsContext = new JsEvalContext(data);
  jstProcess(jsContext, document.getElementById("t"));
  onDocumentLoadOrUpdate();
}

function updateIconClass(iconClass) {
  const iconSelector = isSubFrame ? "#sub-frame-error" : "#main-frame-error";
  const iconElement = document.querySelector(`${iconSelector} .icon`);
  if (!iconElement.classList.contains(iconClass)) {
    iconElement.className = `icon ${iconClass}`;
  }
}

function reloadButtonClick(url) {
  if (window.errorPageController) {
    errorPageController.reloadButtonClick();
  } else {
    window.location = url;
  }
}

function downloadButtonClick() {
  if (window.errorPageController) {
    errorPageController.downloadButtonClick();
    const downloadButton = document.getElementById("download-button");
    downloadButton.disabled = true;
    downloadButton.textContent = downloadButton.disabledText;

    document
      .getElementById("download-link-wrapper")
      .classList.add(HIDDEN_CLASS);
    document
      .getElementById("download-link-clicked-wrapper")
      .classList.remove(HIDDEN_CLASS);
  }
}

function detailsButtonClick() {
  if (window.errorPageController) {
    errorPageController.detailsButtonClick();
  }
}

if (window.top.location !== window.location || window.portalHost) {
  document.documentElement.setAttribute("subframe", "");
  isSubFrame = true;
}

let availableOfflineContent;
let primaryControlOnLeft = true;

function setAutoFetchState(isSaving, canFetchLater) {
  document
    .getElementById("cancel-save-page-button")
    .classList.toggle(HIDDEN_CLASS, !isSaving);
  document
    .getElementById("save-page-for-later-button")
    .classList.toggle(HIDDEN_CLASS, isSaving || !canFetchLater);
}

function savePageLaterClick() {
  errorPageController.savePageForLater();
}

function cancelSavePageClick() {
  errorPageController.cancelSavePage();
  setAutoFetchState(false, true);
}

function toggleErrorInformationPopup() {
  document
    .getElementById("error-information-popup-container")
    .classList.toggle(HIDDEN_CLASS);
}

function launchOfflineItem(id, namespace) {
  errorPageController.launchOfflineItem(id, namespace);
}

function launchDownloadsPage() {
  errorPageController.launchDownloadsPage();
}

function getIconForSuggestedItem(contentItem) {
  switch (contentItem.content_type) {
    case 1:
      return "image-video";
    case 2:
      return "image-music-note";
    case 0:
    case 3:
      return "image-earth";
    default:
      return "image-file";
  }
}

function getSuggestedContentDiv(contentItem, index) {
  let thumbnailHTML = "";
  const classes = [];

  if (contentItem.thumbnail_data_uri) {
    classes.push("suggestion-with-image");
    thumbnailHTML = `<img src="${contentItem.thumbnail_data_uri}">`;
  } else {
    classes.push("suggestion-with-icon");
    thumbnailHTML = `<div><img class="${getIconForSuggestedItem(contentItem)}"></div>`;
  }

  let faviconHTML = "";
  if (contentItem.favicon_data_uri) {
    faviconHTML = `<img src="${contentItem.favicon_data_uri}">`;
  } else {
    classes.push("no-favicon");
  }

  if (!contentItem.attribution_base64) {
    classes.push("no-attribution");
  }

  return `<div class="offline-content-suggestion ${classes.join(" ")}" onclick="launchOfflineItem('${contentItem.ID}', '${contentItem.name_space}')"><div class="offline-content-suggestion-texts"><div id="offline-content-suggestion-title-${index}" class="offline-content-suggestion-title"></div><div class="offline-content-suggestion-attribution-freshness"><div id="offline-content-suggestion-favicon-${index}" class="offline-content-suggestion-favicon">${faviconHTML}</div><div id="offline-content-suggestion-attribution-${index}" class="offline-content-suggestion-attribution"></div><div class="offline-content-suggestion-freshness">${contentItem.date_modified}</div><div class="offline-content-suggestion-pin-spacer"></div><div class="offline-content-suggestion-pin"></div></div></div><div class="offline-content-suggestion-thumbnail">${thumbnailHTML}</div></div>`;
}

function offlineContentAvailable(shouldShowList, contentItems) {
  if (!contentItems || !loadTimeData.valueExists("offlineContentList")) return;

  const contentDivs = contentItems.map((item, index) =>
    getSuggestedContentDiv(item, index),
  );

  document.getElementById("offline-content-suggestions").innerHTML =
    contentDivs.join("\n");

  contentItems.forEach((item, index) => {
    document.getElementById(
      `offline-content-suggestion-title-${index}`,
    ).textContent = decodeUTF16Base64ToString(item.title_base64);
    document.getElementById(
      `offline-content-suggestion-attribution-${index}`,
    ).textContent = decodeUTF16Base64ToString(item.attribution_base64);
  });

  const contentListElement = document.getElementById("offline-content-list");
  if (document.dir === "rtl") {
    contentListElement.classList.add("is-rtl");
  }
  contentListElement.hidden = false;

  if (shouldShowList) {
    toggleOfflineContentListVisibility(false);
  }
}

function toggleOfflineContentListVisibility(isVisible) {
  if (!loadTimeData.valueExists("offlineContentList")) return;

  const listVisible = !document
    .getElementById("offline-content-list")
    .classList.toggle("list-hidden");

  if (isVisible && window.errorPageController) {
    errorPageController.listVisibilityChanged(listVisible);
  }
}

function onDocumentLoadOrUpdate() {
  const downloadMessageExists =
    loadTimeData.valueExists("downloadButton") &&
    loadTimeData.getValue("downloadButton").msg;
  const detailsButton = document.getElementById("details-button");
  const suggestedOfflineContentExists = loadTimeData.valueExists(
    "suggestedOfflineContentPresentation",
  );

  if (suggestedOfflineContentExists) {
    document.querySelector(".nav-wrapper").classList.add(HIDDEN_CLASS);
    detailsButton.classList.add(HIDDEN_CLASS);
    document.getElementById("download-link").hidden = !downloadMessageExists;
    document
      .getElementById("download-links-wrapper")
      .classList.remove(HIDDEN_CLASS);
    document
      .getElementById("error-information-popup-container")
      .classList.add("use-popup-container", HIDDEN_CLASS);
    document
      .getElementById("error-information-button")
      .classList.remove(HIDDEN_CLASS);
  }

  loadTimeData.valueExists("attemptAutoFetch") &&
    loadTimeData.getValue("attemptAutoFetch");

  const reloadMessageExists =
    loadTimeData.valueExists("reloadButton") &&
    loadTimeData.getValue("reloadButton").msg;
  const reloadButton = document.getElementById("reload-button");
  const downloadButton = document.getElementById("download-button");

  if (
    reloadButton.style.display === "none" &&
    downloadButton.style.display === "none"
  ) {
    detailsButton.classList.add("singular");
  }

  document.getElementById("control-buttons").hidden =
    suggestedOfflineContentExists ||
    !(reloadMessageExists || downloadMessageExists);

  const iconClassExists =
    loadTimeData.valueExists("iconClass") && loadTimeData.getValue("iconClass");
  updateIconClass(iconClassExists);

  if (!isSubFrame && iconClassExists === "icon-offline") {
    document.documentElement.classList.add("offline");
    new Runner(".interstitial-wrapper");
  }
}

function onDocumentLoad() {
  const buttonsElement = document.getElementById("buttons");

  if (primaryControlOnLeft) {
    buttonsElement.classList.add("suggested-left");
  } else {
    buttonsElement.classList.add("suggested-right");
  }

  onDocumentLoadOrUpdate();
}

document.addEventListener("DOMContentLoaded", onDocumentLoad);

// Content script
function getPageText() {
    return document.body.innerText;
}

// Envoie le texte au popup ou background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getPageText") {
        sendResponse({ text: getPageText() });
    }
});

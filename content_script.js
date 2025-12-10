// Content script
function getPageText() {
    const article = document.querySelector('article') || 
                    document.querySelector('main') || 
                    document.querySelector('[role="main"]');
    return article ? article.innerText : document.body.innerText;
}
// Envoie le texte au popup ou background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getPageText") {
        sendResponse({ text: getPageText() });
    }
});

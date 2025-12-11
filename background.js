chrome.runtime.onMessage.addListener( async (request, sender, sendResponse) => {
    if (request.action === "downloadLetter") {
        const data = await new Promise(resolve => chrome.storage.local.get("generatedLetter", resolve));
        const letter = (data.generatedLetter || "").trim();
        if (!letter) return;

        // Data URL au lieu de Blob / URL.createObjectURL
        const dataUrl = "data:text/plain;charset=utf-8," + encodeURIComponent(letter);

        chrome.downloads.download({
            url: dataUrl,
            filename: "cover_letter.txt",
            saveAs: true
        });
    }

    // ===== DOWNLOAD CSV (AVEC DATA URL) =====
    if (request.action === "downloadCsv") {
        // ✅ Utiliser une Data URL au lieu de URL.createObjectURL
        const dataUrl = "data:text/csv;charset=utf-8," + encodeURIComponent(request.csvContent);
        
        chrome.downloads.download({
            url: dataUrl,
            filename: `history_${new Date().getTime()}.csv`,
            saveAs: false
        });

        sendResponse({ success: true });
    }
});

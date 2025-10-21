chrome.runtime.onMessage.addListener(async (msg) => {
    if (msg.action === "downloadLetter") {
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
});

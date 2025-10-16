// -------------------- SAVE CV --------------------
document.getElementById("saveCvBtn").addEventListener("click", () => {
    const cv = document.getElementById("cvInput").value;
    chrome.storage.local.set({ userCV: cv }, () => {
        const msg = document.getElementById("message");
        msg.textContent = "CV saved successfully!";
        setTimeout(() => msg.textContent = "", 2000);
    });
});

// -------------------- SAVE API KEY --------------------
document.getElementById("saveApiKeyBtn").addEventListener("click", () => {
    const apiKey = document.getElementById("apiKeyInput").value;
    chrome.storage.local.set({ userApiKey: apiKey }, () => {
        const msg = document.getElementById("message");
        msg.textContent = "API key saved ✅";
        setTimeout(() => msg.textContent = "", 2000);
    });
});

// -------------------- LOAD CV ON POPUP LOAD --------------------
document.addEventListener("DOMContentLoaded", () => {
    chrome.storage.local.get("userCV", (data) => {
        if(data.userCV) document.getElementById("cvInput").value = data.userCV;
    });
    chrome.storage.local.get("userApiKey", (data) => {
        if(data.userApiKey) document.getElementById("apiKeyInput").value = data.userApiKey;
    });
});

// -------------------- GENERATE LETTER --------------------
document.getElementById("generateBtn").addEventListener("click", async () => {
    const getCV = () => new Promise(resolve => chrome.storage.local.get("userCV", resolve));
    const data = await getCV();
    const cv = data.userCV || "";
    const errorMsg = document.getElementById("errorMsg");
    const output = document.getElementById("output");

    // Vérification CV
    if (!cv) {
        errorMsg.textContent = "⚠️ Please enter your CV first.";
        errorMsg.style.display = "block";
        return;
    } else {
        errorMsg.style.display = "none";
    }

    // Message de génération
    output.value = "Generating… please wait";

    // Récupérer le texte de la page
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, { action: "getPageText" }, async (response) => {
            const jobText = response.text || "";
            const prompt = `
Voici mon CV :
${cv}

Voici la description du poste :
${jobText}

Rédige une lettre de motivation personnalisée et professionnelle basée sur mon CV et cette description.
            `;
            const letter = await generateWithGemini(prompt, errorMsg);
            if (letter) {
                output.value = letter;
            } else {
                output.value = "";
            }
        });
    });
});

// -------------------- FETCH GEMINI --------------------
async function generateWithGemini(prompt, errorMsgElement) {
    const storageData = await new Promise(resolve => chrome.storage.local.get("userApiKey", resolve));
    const apiKey = storageData.userApiKey;

    if (!apiKey) {
        if (errorMsgElement) {
            errorMsgElement.textContent = "⚠️ Please enter your API key.";
            errorMsgElement.style.display = "block";
        }
        return null;
    }

    const payload = {
        contents: [{ parts: [{ text: prompt }] }]
    };

    try {
        const response = await fetch(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-goog-api-key": apiKey
                },
                body: JSON.stringify(payload)
            }
        );

        const responseData = await response.json();
        return responseData.candidates?.[0]?.content?.parts?.[0]?.text || "No response from Gemini.";
    } catch (err) {
        console.error("Error generating letter:", err);
        return "Error generating letter: " + err.message;
    }
}

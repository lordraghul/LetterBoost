// ===== TOUT CE CODE VA DANS UN SEUL DOMContentLoaded =====
document.addEventListener('DOMContentLoaded', () => {
    
    // ===== TABS =====
    const tabs = document.querySelectorAll('.tab');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            contents.forEach(c => c.style.display = 'none');
            document.getElementById(tab.dataset.tab).style.display = 'block';
        });
    });

    // ===== LOAD DATA =====
    chrome.storage.local.get("userCV", (data) => {
        if(data.userCV) document.getElementById("cvInput").value = data.userCV;
    });
    chrome.storage.local.get("userApiKey", (data) => {
        if(data.userApiKey) document.getElementById("apiKeyInput").value = data.userApiKey;
    });
    chrome.storage.local.get("generatedLetter", (data) => {
        if (data.generatedLetter) {
            document.getElementById("output").value = data.generatedLetter;
        }
    });

    // ===== SAVE CV =====
    document.getElementById("saveCvBtn").addEventListener("click", () => {
        const cv = document.getElementById("cvInput").value;
        chrome.storage.local.set({ userCV: cv }, () => {
            const msg = document.getElementById("message");
            msg.textContent = "CV saved successfully!";
            setTimeout(() => msg.textContent = "", 2000);
        });
    });

    // ===== SAVE API KEY =====
    document.getElementById("saveApiKeyBtn").addEventListener("click", () => {
        const apiKey = document.getElementById("apiKeyInput").value;
        chrome.storage.local.set({ userApiKey: apiKey }, () => {
            const msg = document.getElementById("message");
            msg.textContent = "API key saved ✅";
            setTimeout(() => msg.textContent = "", 2000);
        });
    });

    // ===== GENERATE LETTER =====
    let lastGenerateTime = 0;
    const GENERATE_COOLDOWN = 5000; // 5 secondes

    const generateBtn = document.getElementById("generateBtn");

    generateBtn.addEventListener("click", async () => {
        // ✅ Vérifier le cooldown
        const now = Date.now();
        if (now - lastGenerateTime < GENERATE_COOLDOWN) {
            const remaining = Math.ceil((GENERATE_COOLDOWN - (now - lastGenerateTime)) / 1000);
            const errorMsg = document.getElementById("errorMsg");
            errorMsg.textContent = `⏳ Please wait ${remaining}s before generating another letter.`;
            errorMsg.style.display = "block";
            return;
        }
        lastGenerateTime = now;

        const getCV = () => new Promise(resolve => chrome.storage.local.get("userCV", resolve));
        generateBtn.disabled = true;
        generateBtn.textContent = "⏳ Generating...";
        
        // ✅ DÉCLARER output ET errorMsg ICI (avant try/catch)
        const errorMsg = document.getElementById("errorMsg");
        const output = document.getElementById("output");
        
        try {
            const data = await getCV();
            const cv = data.userCV || "";

            if (!cv) {
                errorMsg.textContent = "⚠️ Please enter your CV first.";
                errorMsg.style.display = "block";
                return;
            } else {
                errorMsg.style.display = "none";
            }

            output.value = "⏳ Generating… please wait";

            const response = await getActiveTabText();
            const jobText = response?.text || "";
            const language = document.getElementById("languageSelect").value;

            const today = new Date();
            const day = String(today.getDate()).padStart(2, '0');
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const year = today.getFullYear();
            const currentDate = `${day}/${month}/${year}`;

            const languageMap = {
                fr: "French", en: "English", es: "Spanish", de: "German", it: "Italian",
                pt: "Portuguese", nl: "Dutch", sv: "Swedish", no: "Norwegian",
                da: "Danish", fi: "Finnish", pl: "Polish", ru: "Russian",
                ja: "Japanese", zh: "Chinese", ko: "Korean", ar: "Arabic"
            };
            const langName = languageMap[language] || "English";

            const prompt = `
CV:
${cv}

Position:
${jobText}

Write a complete, professional cover letter in ${langName} that is directly ready to send. 
- Include relevant elements from my CV to highlight my skills and experience for the position. 
- Use natural, readable language with standard paragraph formatting (no markdown, no brackets, no bullet points). 
- Keep the letter concise, clear, and polite, ready to be sent by email. 
- Do not include placeholders or generic text.
- The letter must be in ${langName}.
- The letter must be between 250 and 400 words.
- Use the job title and the company name in the subject line if possible.
- Use a professional tone suitable for a job application.
- Do not mention that the letter was generated by AI.
- Do not include any notes or explanations outside the letter content.
- Do NOT use any placeholders or text in brackets (e.g., [Your Address], [City], etc.). 
- If the information is not provided in the CV, simply omit it.
Date: ${currentDate}
`;

            const letter = await generateWithGemini(prompt);
            if (letter) {
                output.value = letter;
                chrome.storage.local.set({ generatedLetter: letter }, () => {
                    console.log("✅ Letter saved in storage.");
                });
            } else {
                output.value = "";
            }
        } catch (err) {
            console.error(err);
            
            // ✅ output ET errorMsg existent maintenant
            if (errorMsg) {
                errorMsg.textContent = err.message || "An unexpected error occurred.";
                errorMsg.style.display = "block";
            }
            output.value = err.message || "An error occurred.";
        } finally {
            generateBtn.disabled = false;
            generateBtn.textContent = "Generate Cover Letter";
        }
    });

    // ===== DOWNLOAD =====
    document.getElementById("downloadBtn").addEventListener("click", async () => {
        chrome.runtime.sendMessage({ action: "downloadLetter" });
    });

});  // ✅ FIN du DOMContentLoaded unique

// ===== HELPER FUNCTION (OUTSIDE DOMContentLoaded) =====
function getActiveTabText() {
    return new Promise((resolve) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (chrome.runtime.lastError) {
                console.info("Content script not available on this page.");
                return resolve({ text: "" });
            }
            if (!tabs || !tabs[0]) return resolve({ text: "" });
            chrome.tabs.sendMessage(tabs[0].id, { action: "getPageText" }, (response) => {
                if (chrome.runtime.lastError) {
                    return resolve({ text: "" });
                }
                resolve(response || { text: "" });
            });
        });
    });
}

// ===== GEMINI FETCH (OUTSIDE DOMContentLoaded) =====
async function generateWithGemini(prompt) {
    const storageData = await new Promise(resolve => chrome.storage.local.get("userApiKey", resolve));
    const apiKey = storageData.userApiKey;
    const errorMsg = document.getElementById("errorMsg");

    if (!apiKey) {
        throw new Error("⚠️ Please enter your API key in Settings.");
    }

    const payload = {
        contents: [{ parts: [{ text: prompt }] }]
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
        if (!navigator.onLine) {
            throw new Error("No internet connection. Please check your network.");
        }

        const response = await fetch(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-goog-api-key": apiKey
                },
                body: JSON.stringify(payload),
                signal: controller.signal
            }
        );

        clearTimeout(timeoutId);

        if (!response.ok) {
            let errorMessage = `API Error ${response.status}`;
            
            if (response.status === 401 || response.status === 403) {
                errorMessage = "❌ Invalid API key. Please check your settings.";
            } else if (response.status === 429) {
                errorMessage = "⏱️ Too many requests. Please wait a moment and try again.";
            } else if (response.status === 500 || response.status === 503) {
                errorMessage = "🔧 Gemini API is temporarily unavailable. Try again later.";
            } else {
                errorMessage = `❌ API returned error: ${response.status} ${response.statusText}`;
            }
            
            throw new Error(errorMessage);
        }

        const responseData = await response.json();

        if (!responseData.candidates || responseData.candidates.length === 0) {
            throw new Error("API returned no content. Try again.");
        }

        const letterContent = responseData.candidates[0]?.content?.parts?.[0]?.text;
        
        if (!letterContent || letterContent.trim() === "") {
            throw new Error("API returned an empty response. Try with a different job description.");
        }

        return letterContent;

    } catch (err) {
        clearTimeout(timeoutId);
        console.error("❌ Error generating letter:", err);
        
        // ✅ LANCER L'ERREUR AU LIEU DE RETOURNER NULL
        throw err;
    }

    
}


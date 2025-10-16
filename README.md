# LetterBoost

LetterBoost is a lightweight Chrome / Brave browser extension that helps job seekers generate professional, personalized cover letters from their CV and the job posting text found on any web page. It extracts the job posting text from the active tab, combines it with the user's stored CV, and sends a prompt to a generative language API (e.g., Gemini) to produce a ready-to-send cover letter.

This README explains what the extension does, how it works, how to install and use it, and important privacy and troubleshooting notes.

## Features

- Save your CV directly in the extension popup for quick reuse.
- Save an API key for a supported generative language service (the extension uses the stored API key to call the model).
- Extract job description text from the current browser tab (content script) and combine it with your CV to produce a concise, professional cover letter.
- Choose the output language (several languages are mapped in the popup UI).
- Output the generated letter into the popup where you can copy it and send it by email.

## How it works (overview)

1. You save your CV and API key in the extension popup (data is stored locally using Chrome extension storage).
2. When you are on a job posting page, open the extension popup and click "Generate".
3. The popup script asks the content script to extract the visible page text.
4. The popup builds a prompt that includes your saved CV, the extracted job posting text, the desired language, and instructions for the language model.
5. The extension sends the prompt to a generative language API using the saved API key and displays the returned cover letter in the popup.

Note: The extension currently targets the Google Generative Language API (Gemini) by calling the model endpoint with the provided API key, but you can adapt the code to other APIs if needed.

## Files in this repository

- `manifest.json` — Extension manifest (permissions: `activeTab`, `scripting`, `storage`).
- `popup.html` — The popup UI shown when the extension icon is clicked.
- `popup.js` — Popup logic: save/load CV and API key, request page text, build prompt, call the model, and display the generated letter.
- `content_script.js` — Content script that extracts the page text and responds to popup requests.
- `background.js` — Background service worker (reserved for future background tasks).
- `icon.png` — Extension icon.

## Installation (developer / local)

1. Open Chrome (or Brave) and go to chrome://extensions (or brave://extensions).
2. Enable "Developer mode" (top-right).
3. Click "Load unpacked" and select the repository folder (this project root).
4. The extension should appear in the toolbar. Click the icon to open the popup.

## Usage

1. Open the extension popup by clicking the toolbar icon.
2. In the popup, paste your CV into the CV textarea and click "Save CV".
3. Paste your API key into the API key field and click "Save API Key". The extension uses this key to call the generative model.
4. On any job posting page, open the popup and choose the desired language in the language selector.
5. Click "Generate". The popup will extract the page text, build a prompt, call the API, and display the generated cover letter.
6. Copy the generated letter and paste it into your email or save it elsewhere.

Important UI/behavior notes:
- If no CV or API key is saved, the popup will show an error asking you to provide them first.
- The extension extracts the page text using a content script that returns `document.body.innerText`. This may include navigation text and other non-job content; for best results, run it on a page where the job description is dominant or copy/paste the posting into the CV field manually.

## Permissions and privacy

- Permissions requested in `manifest.json`:
	- `activeTab` — used to access the currently active tab when requesting its text.
	- `scripting` — included for completeness; the extension uses a content script to extract page text.
	- `storage` — used to store the user's CV and API key locally.

Privacy considerations:
- The extension stores your CV and API key in the browser's local extension storage. This storage is local to your browser profile and not encrypted by the extension.
- When generating a cover letter, the extension sends the saved API key and a prompt containing your CV and the page text to an external generative API endpoint. Ensure you trust the API provider and the key you supply.
- Do not store secrets you are not willing to send to the model provider. If you prefer, consider using a short-lived or restricted API key.

## Configuration / Supported model

The current implementation calls the Google Generative Language (Gemini) endpoint:

"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"

If you want to adapt the extension to another model or provider, edit `popup.js` and replace the `generateWithGemini` function with an adapter for your provider's API. Keep in mind CORS and authentication requirements — some endpoints may not allow direct browser calls.

## Troubleshooting

- "Please enter your CV first." — Save a CV with the "Save CV" button before generating a letter.
- "Please enter your API key." — Save an API key with the "Save API Key" button before generating a letter.
- "No response from Gemini." or other API errors — check your API key, network connection, and the provider's quota/permissions. Open the browser console (right-click the popup > Inspect) to see network errors and logs.
- Generated letter quality issues — the extension builds a short, structured prompt. Improve results by providing a more detailed CV (achievements, responsibilities, keywords) and running the extension on pages where the job description text is clearly present.

## Developer notes and possible improvements

- Improve page text extraction: instead of `document.body.innerText`, try selecting main article content with heuristics or allow manual selection/copy-paste of the job description.
- Secure storage: encrypt stored API keys or add optional cloud storage with user authentication.
- Server-side proxy: to avoid exposing API keys to the client and to handle provider credentials securely, add a small server that accepts CV and job text and forwards requests to the model provider.
- Add export functionality: convert the generated letter to a downloadable PDF using a library such as jsPDF.

## License

This project is provided as-is. There is no explicit license file; add one (for example, MIT) if you intend to publish or share the code.

## Contact

If you have suggestions or want to contribute, open an issue or a pull request in the repository.

---

Thank you for using LetterBoost — good luck with your applications!

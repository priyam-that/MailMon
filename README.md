# MailMon 🤖✉️

**Your AI-Powered Email Sidekick for Gmail**

<p align="center">
  <img src="assets/icon.png" alt="MailMon Logo" width="160" />
</p>

MailMon is a Chrome Extension that supercharges your Gmail experience. It helps you draft emails in seconds using AI and keeps your inbox organized with smart summarization and history tracking.

---

## ✨ Features

- **✍️ AI Email Generation**:
  - Write emails instantly in **Formal**, **Casual**, or **Professional** tones.
  - Powered by open models (Mistral, DeepSeek) via **OpenRouter**.
  
- **📝 Smart Summarization**:
  - Overwhelmed by long threads? MailMon reads the current email and gives you a **concise, bulleted summary** in seconds.
  
- **🚀 Seamless Integration**:
  - Adds a friendly robot icon directly into your Gmail Compose and Reply toolbar.
  - Opens a convenient **Side Panel** so you never have to leave your tab.
  
- **📊 History & Export**:
  - Successfully sent emails are tracked locally.
  - **Export to CSV** anytime to keep your own logs.

---

## 🛠️ Installation

1.  **Clone or Download**:
    ```bash
    git clone https://github.com/yourusername/MailMon.git
    ```
2.  **Load in Chrome**:
    - Open Chrome and go to `chrome://extensions/`.
    - Toggle **Developer mode** (top right).
    - Click **Load unpacked**.
    - Select the `MailMon` folder.

---

## ⚙️ Configuration

To use the AI features, you need a free API Key from [OpenRouter](https://openrouter.ai/).

1.  Open Gmail.
2.  Click the **MailMon icon** (either in the toolbar or next to the Send button).
3.  Click the **⚙️ Settings** icon in the sidebar.
4.  Paste your **OpenRouter API Key**.
5.  (Optional) Select your preferred AI Model (e.g., Mistral 7B Free).
6.  Click **Save**.

---

## 📖 Usage

### Writing Emails
1.  Click **Compose** in Gmail.
2.  Click the **MailMon Robot Icon** next to the Send button.
3.  Select a **Tone** and type a short **Prompt** (e.g., "Ask for a refund").
4.  Click **Generate Email**. The AI will write it for you!

### Summarizing Emails
1.  Open any email thread.
2.  Open the MailMon sidebar.
3.  Click **📝 Summarize Current Email**.
4.  Get a clean, bulleted list of key points.

---

## 🔒 Privacy

- **Your Data Stays Yours**: Email history is stored **locally** in your browser using Chrome Storage API.
- **AI Processing**: Email content is sent to OpenRouter **only** when you explicitly click "Generate" or "Summarize".

---

## 🤝 Contributing

Pull requests are welcome! Feel free to open issues if you find bugs or want to suggest features.

---

*Built with ❤️ using JavaScript & Chrome Extensions API.*

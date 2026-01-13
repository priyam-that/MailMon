# MailMon

**Your AI-Powered Email Sidekick for Gmail**

<p align="center">
  <img src="assets/icon.png" alt="MailMon Logo" width="130" />
</p>

MailMon is a Chrome Extension that enhances your Gmail experience. It helps you draft emails quickly using AI and keeps your inbox organized with smart summarization and history tracking.

---

## Features

- **AI Email Generation**:
  - Write emails instantly in **Formal**, **Casual**, or **Professional** tones.
  - Powered by open models (Mistral, DeepSeek) via **OpenRouter**.

- **Smart Summarization**:
  - Summarize long threads by generating a concise, bulleted summary of the current email.

- **Seamless Integration**:
  - Adds an icon directly into your Gmail Compose and Reply toolbar.
  - Opens a side panel so you can work without leaving your tab.

- **History and Export**:
  - Successfully sent emails are tracked locally.
  - Export to CSV anytime to keep your own logs.

---

## Installation

1. **Clone or Download**:
   ```bash
   git clone https://github.com/priyam-that/MailMon.git
   ```
2. **Load in Chrome**:
   - Open Chrome and go to `chrome://extensions/`.
   - Toggle **Developer mode** (top right).
   - Click **Load unpacked**.
   - Select the `MailMon` folder.

---

## Configuration

To use the AI features, you need a free API key from [OpenRouter](https://openrouter.ai/).

1. Open Gmail.
2. Click the **MailMon icon** (either in the toolbar or next to the Send button).
3. Click the **Settings** icon in the sidebar.
4. Paste your **OpenRouter API key**.
5. (Optional) Select your preferred AI model (for example, Mistral 7B Free).
6. Click **Save**.

---

## Usage

### Writing Emails
1. Click **Compose** in Gmail.
2. Click the **MailMon icon** next to the Send button.
3. Select a **tone** and type a short **prompt** (for example, "Ask for a refund").
4. Click **Generate Email**.

### Summarizing Emails
1. Open any email thread.
2. Open the MailMon sidebar.
3. Click **Summarize Current Email**.
4. Review a bulleted list of key points.

---

## Privacy

- **Your data stays yours**: Email history is stored locally in your browser using the Chrome Storage API.
- **AI processing**: Email content is sent to OpenRouter only when you explicitly click **Generate** or **Summarize**.

---

## Contributing

Pull requests are welcome. Open an issue to report bugs or suggest improvements.
Give it a Star if you like it 
---

Built with JavaScript and the Chrome Extensions API.

// Background Script

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'saveHistory') {
        saveEmailToHistory(request.data);
    } else if (request.action === 'downloadHistory') {
        downloadHistory();
    }
    return true; // Keep channel open
});

function saveEmailToHistory(emailData) {
    chrome.storage.local.get(['emailHistory'], (result) => {
        const history = result.emailHistory || [];
        history.push(emailData);
        chrome.storage.local.set({ emailHistory: history });
    });
}

function downloadHistory() {
    chrome.storage.local.get(['emailHistory'], (result) => {
        const history = result.emailHistory || [];

        if (history.length === 0) {
            console.log("History empty");
            return;
        }

        // CSV Header
        let csvContent = "Date,Recipient,Subject,Content\n";

        history.forEach(row => {
            // Escape quotes and handle newlines in content
            const subject = (row.subject || '').replace(/"/g, '""');
            const recipient = (row.recipient || '').replace(/"/g, '""');
            const content = (row.content || '').replace(/"/g, '""').replace(/\n/g, ' ');

            csvContent += `"${row.date}","${recipient}","${subject}","${content}"\n`;
        });

        // Use Data URI for simplicity in Service Worker
        const url = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent);

        chrome.downloads.download({
            url: url,
            filename: 'mailmon_history.csv'
        });
    });
}

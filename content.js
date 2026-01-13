console.log("MailMon Content Script Loaded");

// --- SELECTORS ---
// Gmail is tricky. We'll try multiple selectors for the Send button container.
const SELECTORS = {
    // The main "Send" button usually has these attributes.
    sendButton: 'div[role="button"][aria-label^="Send"]',
    // The container for the Send button and "More options" arrow. This is reliable.
    sendButtonContainer: '.gU.Up',
    // Fallback: The row containing buttons (formatting toolbar is separate).
    toolbarRow: 'tr.btC',
};

// --- SIDEBAR LOGIC ---
let sidebarIframe = null;

function toggleSidebar() {
    if (sidebarIframe) {
        // Toggle visibility if already exists
        if (sidebarIframe.style.display === 'none') {
            sidebarIframe.style.display = 'block';
        } else {
            sidebarIframe.style.display = 'none';
        }
        return;
    }

    // Create Iframe
    sidebarIframe = document.createElement('iframe');
    sidebarIframe.src = chrome.runtime.getURL('popup.html');
    sidebarIframe.style.position = 'fixed';
    sidebarIframe.style.top = '0';
    sidebarIframe.style.right = '0';
    sidebarIframe.style.width = '340px'; // Slightly wider than body
    sidebarIframe.style.height = '100vh';
    sidebarIframe.style.border = 'none';
    sidebarIframe.style.zIndex = '999999';
    sidebarIframe.style.boxShadow = '-2px 0 5px rgba(0,0,0,0.1)';
    sidebarIframe.style.backgroundColor = 'white';

    document.body.appendChild(sidebarIframe);

    // Listen for close requests from inside
    window.addEventListener('message', (event) => {
        if (event.data.action === 'closeSidebar') {
            sidebarIframe.style.display = 'none';
        }
    });
}

// --- ICON INJECTION ---
function createIcon() {
    const iconContainer = document.createElement('div');
    iconContainer.className = 'mailmon-icon-container';
    iconContainer.title = "Open MailMon Assistant";

    // Style matches Gmail's button heights usually
    Object.assign(iconContainer.style, {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '36px',
        height: '36px',
        marginLeft: '8px',
        cursor: 'pointer',
        borderRadius: '4px',
        transition: 'background 0.2s'
    });

    // Hover effect
    iconContainer.onmouseover = () => iconContainer.style.backgroundColor = 'rgba(0,0,0,0.05)';
    iconContainer.onmouseout = () => iconContainer.style.backgroundColor = 'transparent';

    const icon = document.createElement('img');
    icon.src = chrome.runtime.getURL('assets/icon.png');
    icon.style.width = '20px';
    icon.style.height = '20px';

    iconContainer.appendChild(icon);

    iconContainer.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleSidebar();
    };

    return iconContainer;
}

function scanAndInject() {
    // We look for the "Send" button container (.gU.Up)
    // context: .gU.Up is the [Send | v] group. We want to be next to it.
    const sendContainers = document.querySelectorAll(SELECTORS.sendButtonContainer);

    sendContainers.forEach(container => {
        // Check if we already injected in this SPECIFIC container's parent or nearby
        // The container .gU.Up is usually inside a cell <td> or flex <div>.
        // We want to append to the PARENT of .gU.Up to sit next to it.
        const parent = container.parentElement;

        if (parent && !parent.querySelector('.mailmon-icon-container')) {
            const icon = createIcon();
            // styling details
            parent.style.display = 'flex'; // Ensure flex to sit side-by-side
            parent.style.alignItems = 'center';

            parent.appendChild(icon);
            console.log("MailMon: Icon injected successfully.");
        }
    });

    // Fallback if .gU.Up isn't found (e.g., plain HTML mode or changed class)
    if (sendContainers.length === 0) {
        const rawSendButtons = document.querySelectorAll('div[role="button"][aria-label^="Send"]');
        rawSendButtons.forEach(btn => {
            const parent = btn.parentElement;
            // Often the button is in a container, we want to go up one level if it's tight
            if (parent && !parent.querySelector('.mailmon-icon-container')) {
                // Avoid injecting inside the button itself
                const targetContainer = parent.parentElement; // Go up one more?
                if (targetContainer && !targetContainer.querySelector('.mailmon-icon-container')) {
                    const icon = createIcon();
                    targetContainer.appendChild(icon);
                    console.log("MailMon: Icon injected via fallback.");
                }
            }
        });
    }
}

// Observe DOM
const observer = new MutationObserver((mutations) => {
    // Throttle slightly or just run? Run is cheap if we check presence.
    scanAndInject();
});

observer.observe(document.body, { childList: true, subtree: true });

// Initial run
// setTimeout to let Gmail load a bit if freshly opened, though Observer catches most
setTimeout(scanAndInject, 1000);
setTimeout(scanAndInject, 3000); // multiple checks

// --- HISTORY & UTILS ---
function setupHistoryListener() {
    document.addEventListener('click', (e) => {
        const target = e.target.closest('div[role="button"][aria-label^="Send"]');
        if (target) {
            captureEmailData(target);
        }
    }, true);
}

function captureEmailData(sendBtn) {
    const form = sendBtn.closest('div[role="dialog"]') || sendBtn.closest('table');
    if (form) {
        const subjectBox = form.querySelector('input[name="subjectbox"]');
        const recipients = form.querySelector('input[name="to"]') || form.querySelector('div[name="to"]');
        const body = form.querySelector('div[contenteditable="true"]');

        const emailData = {
            date: new Date().toISOString(),
            subject: subjectBox ? subjectBox.value : '(No Subject)',
            recipient: recipients ? (recipients.value || recipients.innerText) : '(Unknown)',
            content: body ? body.innerText : ''
        };
        chrome.runtime.sendMessage({ action: 'saveHistory', data: emailData });
    }
}

// --- EMAIL READING ---
function getEmailContent() {
    // We need to find the currently open email content.
    // .h7 is often the subject. .a3s is often the message body.
    // .gE.iv.gt is also a wrapper for the date/sender info.

    const subjectElement = document.querySelector('h2.hP'); // Valid subject selector in many views
    const bodyElements = document.querySelectorAll('.a3s.aiL'); // Main message bodies in thread

    // If multiple bodies (thread), take the last one or all?
    // Let's take all text content joined.
    let fullBody = '';
    bodyElements.forEach(el => {
        if (el.innerText) {
            fullBody += el.innerText + '\n\n---\n\n';
        }
    });

    return {
        subject: subjectElement ? subjectElement.innerText : 'No Subject',
        body: fullBody.trim() || 'No email content found. Please open an email thread.'
    };
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'insertText') {
        const activeElement = document.activeElement;
        const composeBody = document.querySelector('div[contenteditable="true"][role="textbox"]');
        const target = (activeElement && activeElement.getAttribute('contenteditable') === 'true') ? activeElement : composeBody;

        if (target) {
            target.focus();
            document.execCommand('insertText', false, request.text);
            sendResponse({ success: true });
        } else {
            console.warn("MailMon: Could not find compose window.");
            sendResponse({ success: false });
        }
    } else if (request.action === 'readEmail') {
        const data = getEmailContent();
        sendResponse(data);
    }
});

setupHistoryListener();

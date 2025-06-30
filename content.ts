
/// <reference types="chrome" />

// content.ts

const HEXA_SIDEBAR_ID = "hexa-ai-sidebar-iframe";
const HEXA_TOOLBAR_ID = "hexa-floating-toolbar";

let sidebar: HTMLIFrameElement | null = null;
let hexaToolbar: HTMLDivElement | null = null;
let lastSelectionText = "";

function createSidebar() {
  if (document.getElementById(HEXA_SIDEBAR_ID)) return;

  sidebar = document.createElement("iframe");
  sidebar.id = HEXA_SIDEBAR_ID;
  sidebar.src = chrome.runtime.getURL("index.html");
  sidebar.style.cssText = `
    position: fixed;
    top: 0;
    right: 0;
    width: 400px;
    height: 100vh;
    border: none;
    box-shadow: -2px 0 15px rgba(0,0,0,0.15);
    z-index: 2147483647;
    transform: translateX(100%);
    transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    background-color: #fff;
  `;

  document.body.appendChild(sidebar);
}

function toggleSidebar(forceOpen = false) {
  if (!sidebar) {
    createSidebar();
    // Allow iframe to load before showing
    setTimeout(() => toggleSidebar(true), 100);
    return;
  }

  const isVisible = sidebar.style.transform === "translateX(0px)";
  if (forceOpen) {
    sidebar.style.transform = "translateX(0px)";
  } else {
    sidebar.style.transform = isVisible ? "translateX(100%)" : "translateX(0px)";
  }
}

function createToolbar() {
  if (document.getElementById(HEXA_TOOLBAR_ID)) return;

  hexaToolbar = document.createElement("div");
  hexaToolbar.id = HEXA_TOOLBAR_ID;
  hexaToolbar.style.cssText = `
    position: absolute;
    z-index: 2147483646;
    background-color: #1f2937;
    color: white;
    padding: 6px 10px;
    border-radius: 6px;
    font-size: 14px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    cursor: pointer;
    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    display: none;
    user-select: none;
  `;
  hexaToolbar.innerText = "Ask Hexa";
  
  hexaToolbar.addEventListener("mousedown", (e) => e.stopPropagation());
  hexaToolbar.addEventListener("click", (e) => {
    e.stopPropagation();
    if(lastSelectionText) {
       sendMessageToSidebar({ action: "ask-about-selection", text: lastSelectionText });
    }
    hideToolbar();
  });

  document.body.appendChild(hexaToolbar);
}

function showToolbar() {
    if (!hexaToolbar) createToolbar();
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
        hideToolbar();
        return;
    }
    
    lastSelectionText = selection.toString().trim();
    if (!lastSelectionText) {
        hideToolbar();
        return;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    if(hexaToolbar) {
        hexaToolbar.style.display = "block";
        hexaToolbar.style.top = `${window.scrollY + rect.bottom + 5}px`;
        hexaToolbar.style.left = `${window.scrollX + rect.left}px`;
    }
}

function hideToolbar() {
    if (hexaToolbar) {
        hexaToolbar.style.display = "none";
    }
}


function sendMessageToSidebar(message: object) {
    if (!sidebar) {
        toggleSidebar(true);
        // Wait for sidebar to be ready
        const interval = setInterval(() => {
            if(sidebar?.contentWindow) {
                sidebar.contentWindow.postMessage(message, "*");
                clearInterval(interval);
            }
        }, 100);
    } else {
        toggleSidebar(true);
        sidebar.contentWindow?.postMessage(message, "*");
    }
}


// --- Main Listeners ---

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "toggle-sidebar") {
    toggleSidebar();
  } else if (request.action === "ask-about-selection" && request.text) {
    sendMessageToSidebar(request);
  }
  return true;
});


document.addEventListener("mouseup", () => {
    setTimeout(showToolbar, 10);
});

document.addEventListener("mousedown", () => {
    hideToolbar();
});

// Initial creation
createToolbar();

export {};

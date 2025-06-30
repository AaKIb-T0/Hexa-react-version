/// <reference types="chrome" />

// background.ts

// --- Constants ---
const CONTEXT_MENU_ID = "ask-hexa";
const HEXA_SIDEBAR_ID = "hexa-ai-sidebar-iframe";

// --- Helper Functions ---
async function getActiveTab(): Promise<chrome.tabs.Tab> {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tabs.length === 0) {
    throw new Error("No active tab found.");
  }
  return tabs[0];
}

async function sendMessageToTab(tabId: number, message: object) {
  try {
    await chrome.tabs.sendMessage(tabId, message);
  } catch (error) {
    console.warn("Hexa: Could not send message to tab. It might be a protected page or not yet ready.", error);
  }
}

// --- Event Listeners ---

// 1. Extension Icon Clicked
chrome.action.onClicked.addListener(async (tab) => {
  if (tab.id) {
    sendMessageToTab(tab.id, { action: "toggle-sidebar" });
  }
});

// 2. Context Menu Setup on Installation
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: CONTEXT_MENU_ID,
    title: "Ask Hexa about '%s'",
    contexts: ["selection"],
  });
});

// 3. Context Menu Clicked
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === CONTEXT_MENU_ID && info.selectionText && tab?.id) {
    sendMessageToTab(tab.id, {
      action: "ask-about-selection",
      text: info.selectionText,
    });
  }
});

// 4. Listen for messages from content scripts or the React app
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Handle screen capture requests from the sidebar
  if (request.action === 'capture-screen') {
    chrome.tabs.captureVisibleTab({ format: "jpeg", quality: 90 }, (dataUrl) => {
      if (chrome.runtime.lastError || !dataUrl) {
        console.error("Hexa: Error capturing tab:", chrome.runtime.lastError?.message);
        sendResponse({ error: "Failed to capture screen." });
        return;
      }
      sendResponse({ dataUrl: dataUrl });
    });
    return true; // Indicates that the response is sent asynchronously
  }
  
  // --- Handle Storage Actions ---
  if (request.action === 'get-chat-history') {
    chrome.storage.local.get(['chatHistory'], (result) => {
      if (chrome.runtime.lastError) {
        console.error("Hexa: Error getting chat history:", chrome.runtime.lastError.message);
        sendResponse({ error: chrome.runtime.lastError.message });
      } else {
        sendResponse({ data: result.chatHistory || [] });
      }
    });
    return true; // Async response required
  }

  if (request.action === 'save-chat-history') {
    chrome.storage.local.set({ chatHistory: request.data }, () => {
      if (chrome.runtime.lastError) {
        console.error("Hexa: Error saving chat history:", chrome.runtime.lastError.message);
      }
    });
    // No response needed, but we don't return true
    return;
  }

  if (request.action === 'clear-chat-history') {
    chrome.storage.local.remove('chatHistory', () => {
      if (chrome.runtime.lastError) {
        console.error("Hexa: Error clearing chat history:", chrome.runtime.lastError.message);
      }
    });
    // No response needed
    return;
  }

  return false; // No other actions matched
});

export {};

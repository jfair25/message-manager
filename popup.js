import { locations } from './master.js';
import { messages } from './master.js';
import { retreiveGlobalMsg } from './master.js';

// Centralized navigation tracker to map which layout panel sits behind the back button
let currentActiveView = 'msgs';

function populateMsgs(containerId) {
  currentActiveView = 'msgs';
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  container.removeAttribute('hidden');

  const savedData = localStorage.getItem('customMessages');
  const activeMessages = savedData ? JSON.parse(savedData) : messages;

  activeMessages.forEach((buttonHash, idx) => {
    const button = document.createElement('button');
    button.textContent = buttonHash.label;
    button.className = `btn ${buttonHash.className}`;
    button.dataset.content = buttonHash.content;
    
    // Attach standard drag configurations
    button.draggable = true;

    button.addEventListener('click', () => {
      container.hidden = true;
      localStorage.setItem('globalLabel', buttonHash.label);
      localStorage.setItem("globalMisc", buttonHash.misc);
      localStorage.setItem("globalGeo_on", buttonHash.geo_on);
      handleMsgButtonClick(buttonHash.label);
    });

    // Drag-and-drop lifecycle mechanics
    button.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', idx);
      button.classList.add('dragging');
    });

    button.addEventListener('dragend', () => {
      button.classList.remove('dragging');
    });

    button.addEventListener('dragover', (e) => {
      e.preventDefault();
    });

    button.addEventListener('drop', (e) => {
      e.preventDefault();
      const originIdx = parseInt(e.dataTransfer.getData('text/plain'), 10);
      const destIdx = idx;

      if (originIdx !== destIdx) {
        const itemToMove = activeMessages[originIdx];
        activeMessages.splice(originIdx, 1);
        activeMessages.splice(destIdx, 0, itemToMove);
        
        localStorage.setItem('customMessages', JSON.stringify(activeMessages));
        populateMsgs(containerId);
      }
    });

    container.appendChild(button);
  });
}

function populateGeos(containerId) {
  const container = document.getElementById(containerId);
  const backContainer = document.getElementById('back');
  const geo_on = localStorage.getItem("globalGeo_on");
  container.innerHTML = '';
  backContainer.hidden = false;

  if (geo_on == 1) {
    currentActiveView = 'geos';
    container.hidden = false;
  } else {
    currentActiveView = 'geos_skipped';
    container.hidden = true;
    miscellaneous('misc-fields');
    return;
  }

  const savedLocs = localStorage.getItem('customLocations');
  const activeLocations = savedLocs ? JSON.parse(savedLocs) : locations;

  activeLocations.forEach((buttonHash, idx) => {
    const button = document.createElement('button');
    button.textContent = buttonHash.label;
    button.className = `btn ${buttonHash.className}`;
    button.dataset.content = buttonHash.content;
    
    // Attach standard drag configurations
    button.draggable = true;

    button.addEventListener('click', () => {
      container.hidden = true;
      localStorage.setItem("globalGeo", buttonHash.content);
      handleGeoButtonClick(buttonHash.content);
    });

    // Drag-and-drop lifecycle mechanics
    button.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', idx);
      button.classList.add('dragging');
    });

    button.addEventListener('dragend', () => {
      button.classList.remove('dragging');
    });

    button.addEventListener('dragover', (e) => {
      e.preventDefault();
    });

    button.addEventListener('drop', (e) => {
      e.preventDefault();
      const originIdx = parseInt(e.dataTransfer.getData('text/plain'), 10);
      const destIdx = idx;

      if (originIdx !== destIdx) {
        const itemToMove = activeLocations[originIdx];
        activeLocations.splice(originIdx, 1);
        activeLocations.splice(destIdx, 0, itemToMove);
        
        localStorage.setItem('customLocations', JSON.stringify(activeLocations));
        populateGeos(containerId);
      }
    });

    container.appendChild(button);
  });
}


// Function to handle miscellaneous inputs and fields view layout
function miscellaneous(containerId) {
  if (currentActiveView !== 'geos_skipped') {
    currentActiveView = 'misc';
  }
  const container = document.getElementById(containerId);
  const ldapContainer = document.getElementById('ldap');
  const carContainer = document.getElementById('car');
  const chargeContainer = document.getElementById('charge');
  const backContainer = document.getElementById('back');

  // Forcefully hide ALL elements initially to clear stale layouts from previous screen lookups
  ldapContainer.hidden = true;
  carContainer.hidden = true;
  chargeContainer.hidden = true;

  const misc = localStorage.getItem("globalMisc");

  // Router handles switching visibility flags strictly on demand
  if (misc == 1) {
    carContainer.hidden = false;
  } else if (misc == 2) {
    carContainer.hidden = false;
    chargeContainer.hidden = false;
  } else if (misc == 3) {
    carContainer.hidden = false;
    ldapContainer.hidden = false;
  } else if (misc == 4) {
    carContainer.hidden = false;
    ldapContainer.hidden = false;
    chargeContainer.hidden = false;
  }

  const fields = ['ldap', 'car', 'charge'];

  fields.forEach(fieldId => {
    const inputElement = document.getElementById(fieldId);
    // Note: Make sure your HTML element matching fieldId is the actual text input tag 
    // or select the input inside it cleanly if using structured div wrapper layouts.
    const storageKey = `global${fieldId.charAt(0).toUpperCase() + fieldId.slice(1)}`;

    if (inputElement) {
      inputElement.value = localStorage.getItem(storageKey) || '';

      if (!inputElement.dataset.hasListener) {
        inputElement.addEventListener('input', (e) => {
          localStorage.setItem(storageKey, e.target.value);
        });
        inputElement.dataset.hasListener = 'true';
      }
    }
  });

  backContainer.hidden = false;
  container.hidden = false;
}


// Execution Routers
function handleMsgButtonClick(content) {
  populateGeos('geo-buttons');
}

// Visual Toast System for Popup Context
function showCopiedToast() {
  const toast = document.createElement('div');
  toast.textContent = 'Copied';
  Object.assign(toast.style, {
    position: 'fixed',
    bottom: '15px',
    right: '15px',
    backgroundColor: '#2c3539',
    color: '#ffffff',
    padding: '8px 16px',
    borderRadius: '6px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
    fontFamily: 'sans-serif',
    fontSize: '13px',
    zIndex: '999999',
    transition: 'opacity 0.3s ease, transform 0.3s ease',
    opacity: '0',
    transform: 'translateY(5px)'
  });
  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  });

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(5px)';
    setTimeout(() => toast.remove(), 300);
  }, 1500);
}

function handleGeoButtonClick(content) {
  miscellaneous('misc-fields');
}

function launchMessagesSettingsPanel() {
  chrome.windows.create({
    url: chrome.runtime.getURL("settings.html"),
    type: "popup", // Spawns a clean app container window shell without tab strips or URL fields
    width: 820,
    height: 850,
    focused: true
  });
}



function autoExtractClipboardData() {
  try {
    //  Build scratchpad textarea layout element to catch system clipboard contents safely
    const scraper = document.createElement('textarea');
    scraper.style.position = 'fixed';
    scraper.style.opacity = '0';
    document.body.appendChild(scraper);
    
    // Shift programmatic focus onto the scraper node and fire paste sequence
    scraper.focus();
    const pasteSuccess = document.execCommand('paste');
    const text = scraper.value ? scraper.value.trim() : '';
    
    document.body.removeChild(scraper);

    if (!pasteSuccess || !text) return;

    let d = '';
    let c = '';
    let p = '';

    //  Router sorts format pipelines seamlessly
    if (text.includes('|')) {
      const parts = text.split('|');
      d = parts[0] ? parts[0].trim() : '';
      c = parts[1] ? parts[1].trim() : '';
      p = parts[2] ? parts[2].trim() : '';
    } else {
      const driverMatch = text.match(/Drivers\b\s*[:\-]?\s*([\w\d]+(?:\s*[\/\-]\s*[\w\d]+)*)/i);
      const carMatch = text.match(/Car\s+(\d+)/i);
      const percentMatch = text.match(/(\d{2})%/);

      d = driverMatch ? driverMatch[1].trim() : '';
      c = carMatch ? carMatch[1].trim() : '';
      p = percentMatch ? percentMatch[1].trim() : '';
    }

    if (/^[\s\-\/]+$/.test(d)) {
      d = '';
    }

    const ldapWrapper = document.getElementById('ldap');
    const carWrapper = document.getElementById('car');
    const chargeWrapper = document.getElementById('charge');

    const ldapInput = ldapWrapper ? ldapWrapper.querySelector('input') : null;
    const carInput = carWrapper ? carWrapper.querySelector('input') : null;
    const chargeInput = chargeWrapper ? chargeWrapper.querySelector('input') : null;

    // If elements are parsed cleanly, inject details and store them
    if (d && ldapInput) {
      ldapInput.value = d;
      localStorage.setItem('globalLdap', d);
    }
    if (c && carInput) {
      carInput.value = c;
      localStorage.setItem('globalCar', c);
    }
    if (p && chargeInput) {
      chargeInput.value = p;
      localStorage.setItem('globalCharge', p);
    }

  } catch (err) {
    console.warn('Silent auto-extraction omitted or blocked by host permissions:', err);
  }
}



// Setup Application Lifecycle Hooks
document.addEventListener('DOMContentLoaded', () => {
  const backBtn = document.querySelector('.backBtn');
  const copyBtn = document.getElementById('copyBtn');
  const backContainer = document.getElementById('back');

 autoExtractClipboardData();

  const setMsgBtn = document.getElementById('set-msg-btn');
  if (setMsgBtn) {
    setMsgBtn.addEventListener('click', launchMessagesSettingsPanel);
  }

  const menuDotsBtn = document.getElementById('menu-dots-btn');
  if (menuDotsBtn) {
    menuDotsBtn.addEventListener('click', launchMessagesSettingsPanel);
  }

  backBtn.addEventListener('click', () => {
    if (currentActiveView === 'geos') {
      document.getElementById('geo-buttons').hidden = true;
      backContainer.hidden = true;
      populateMsgs('msg-buttons');
    } else if (currentActiveView === 'misc') {
      document.getElementById('misc-fields').hidden = true;
      populateGeos('geo-buttons');
    } else if (currentActiveView === 'geos_skipped') {
      document.getElementById('misc-fields').hidden = true;
      backContainer.hidden = true;
      populateMsgs('msg-buttons');
    }
  });

  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      try {
        await retreiveGlobalMsg();
        const msg = localStorage.getItem("globalMsg") || '';
        const htmlBlob = new Blob([msg], { type: 'text/html' });
        await navigator.clipboard.write([
          new ClipboardItem({ 'text/html': htmlBlob })
        ]);

        const messageElement = document.getElementById('message');
        if (messageElement) {
          messageElement.removeAttribute('hidden');
        }
        showCopiedToast();

        const keysToClean = ['globalLabel', 'globalMisc', 'globalGeo_on', 'globalGeo', 'globalLdap', 'globalCar', 'globalCharge', 'globalMsg'];
        keysToClean.forEach(k => localStorage.removeItem(k));

        const inputFields = ['ldap', 'car', 'charge'];
        inputFields.forEach(fieldId => {
          const inputElement = document.getElementById(fieldId);
          if (inputElement) {
            inputElement.value = '';
          }
        });
      } catch (err) {
        console.error('Failed to copy text layout: ', err);
      }
    });
  }
  populateMsgs('msg-buttons');
});
import { categories, locations, messages, retreiveGlobalMsg } from './messages.js';

// Global state navigation routers
let currentActiveView = 'categories';
let selectedCategory = '';

// Pre-query frequently accessed layout containers (Cache)
const DOM = {
  catSection: document.getElementById('category-container'),
  msgContainer: document.getElementById('msg-buttons'),
  geoContainer: document.getElementById('geo-buttons'),
  miscFields: document.getElementById('misc-fields'),
  backBtnContainer: document.getElementById('back'),
  catButtons: document.getElementById('category-buttons'),
  successMsg: document.getElementById('message'),
  inputs: {
    ldap: document.getElementById('ldap'),
    car: document.getElementById('car'),
    charge: document.getElementById('charge')
  }
};

function populateCategories() {
  currentActiveView = 'categories';

  const catSection = document.getElementById('category-container');
  const msgContainer = document.getElementById('msg-buttons');
  const backContainer = document.getElementById('back');

  if (catSection) catSection.removeAttribute('hidden');
  if (msgContainer) msgContainer.setAttribute('hidden', 'true');
  if (backContainer) backContainer.setAttribute('hidden', 'true');

  const containerButtons = document.getElementById('category-buttons');
  if (!containerButtons) return;
  containerButtons.innerHTML = '';

  const savedCats = localStorage.getItem('customCategories');
  const activeCategories = savedCats ? JSON.parse(savedCats) : categories;

  const fragment = document.createDocumentFragment();

  activeCategories.forEach((cat, idx) => {
    const button = document.createElement('button');
    button.textContent = cat.label;
    button.className = 'btn category-btn-style';

    button.draggable = true;

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

      if (originIdx !== destIdx && !isNaN(originIdx)) {
        const itemToMove = activeCategories[originIdx];
        activeCategories.splice(originIdx, 1);
        activeCategories.splice(destIdx, 0, itemToMove);

        localStorage.setItem('customCategories', JSON.stringify(activeCategories));
        populateCategories();
      }
    });

    button.addEventListener('click', (e) => {
      if (e.target.classList.contains('dragging')) return;

      if (catSection) catSection.setAttribute('hidden', 'true');
      selectedCategory = cat.id;
      populateMsgsFiltered();
    });

    fragment.appendChild(button);
  });

  DOM.catButtons.appendChild(fragment);
}

function selectMessageTemplate(buttonHash, autoCopy = false) {
  if (DOM.catSection) DOM.catSection.setAttribute('hidden', 'true');
  if (DOM.msgContainer) DOM.msgContainer.setAttribute('hidden', 'true');
  if (DOM.geoContainer) DOM.geoContainer.setAttribute('hidden', 'true');
  if (DOM.miscFields) DOM.miscFields.setAttribute('hidden', 'true');
  if (DOM.backBtnContainer) DOM.backBtnContainer.removeAttribute('hidden');

  selectedCategory = buttonHash.category;
  localStorage.setItem('globalLabel', buttonHash.label);
  localStorage.setItem("globalMisc", buttonHash.misc);
  localStorage.setItem("globalGeo_on", buttonHash.geo_on);

  const detectedGeo = localStorage.getItem("globalGeo");

  if (buttonHash.geo_on == 1) {
    if (detectedGeo) {
      miscellaneous(true);
      if (autoCopy) {
        performCopy(true);
      }
    } else {
      populateGeos(autoCopy);
    }
  } else {
    localStorage.setItem("globalGeo", "");
    miscellaneous(false);
    if (autoCopy) {
      performCopy(true);
    }
  }
}

function populateMsgsFiltered() {
  currentActiveView = 'msgs';
  if (!DOM.msgContainer) return;

  DOM.msgContainer.innerHTML = '';
  DOM.msgContainer.removeAttribute('hidden');
  if (DOM.backBtnContainer) DOM.backBtnContainer.removeAttribute('hidden');

  const savedData = localStorage.getItem('customMessages');
  const activeMessages = savedData ? JSON.parse(savedData) : messages;
  const filtered = activeMessages.filter(m => m.category === selectedCategory);

  if (filtered.length === 0) {
    DOM.msgContainer.innerHTML = `<div style="grid-column: span 2; text-align:center; color: var(--text-secondary); font-size:12px; padding:20px;">Empty Category</div>`;
    return;
  }

  const fragment = document.createDocumentFragment();
  filtered.forEach((buttonHash, idx) => {
    const button = document.createElement('button');
    button.className = `btn ${buttonHash.className}`;

    const labelSpan = document.createElement('span');
    labelSpan.textContent = buttonHash.label;
    button.appendChild(labelSpan);

    if (buttonHash.hkMod && buttonHash.hkMod !== 'none' && buttonHash.hkKey) {
      const badge = document.createElement('span');
      badge.className = 'hotkey-badge';
      badge.textContent = `${buttonHash.hkMod.toUpperCase()}+${buttonHash.hkKey.toUpperCase()}`;
      button.appendChild(badge);
    }

    button.draggable = true;

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
      const originFilteredIdx = parseInt(e.dataTransfer.getData('text/plain'), 10);
      const destFilteredIdx = idx;

      if (originFilteredIdx !== destFilteredIdx && !isNaN(originFilteredIdx)) {
        const itemToMove = filtered[originFilteredIdx];
        const globalOriginIdx = activeMessages.indexOf(itemToMove);
        const globalDestIdx = activeMessages.indexOf(filtered[destFilteredIdx]);

        if (globalOriginIdx !== -1 && globalDestIdx !== -1) {
          activeMessages.splice(globalOriginIdx, 1);
          activeMessages.splice(globalDestIdx, 0, itemToMove);

          localStorage.setItem('customMessages', JSON.stringify(activeMessages));
          populateMsgsFiltered();
        }
      }
    });

    button.addEventListener('click', () => {
      selectMessageTemplate(buttonHash, false);
    });
    fragment.appendChild(button);
  });
  DOM.msgContainer.appendChild(fragment);
}

function populateGeos(autoCopyAfterGeo = false) {
  currentActiveView = 'geos';
  if (!DOM.geoContainer) return;
  DOM.geoContainer.innerHTML = '';
  DOM.geoContainer.removeAttribute('hidden');

  const savedLocs = localStorage.getItem('customLocations');
  const activeLocations = savedLocs ? JSON.parse(savedLocs) : locations;

  const fragment = document.createDocumentFragment();
  activeLocations.forEach((buttonHash, idx) => {
    const button = document.createElement('button');
    button.textContent = buttonHash.label;
    button.className = `btn ${buttonHash.className}`;

    button.draggable = true;

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

      if (originIdx !== destIdx && !isNaN(originIdx)) {
        const itemToMove = activeLocations[originIdx];
        activeLocations.splice(originIdx, 1);
        activeLocations.splice(destIdx, 0, itemToMove);

        localStorage.setItem('customLocations', JSON.stringify(activeLocations));
        populateGeos(autoCopyAfterGeo);
      }
    });

    button.addEventListener('click', () => {
      DOM.geoContainer.setAttribute('hidden', 'true');
      localStorage.setItem("globalGeo", buttonHash.content);
      miscellaneous(false);
      if (autoCopyAfterGeo) {
        performCopy(true);
      }
    });
    fragment.appendChild(button);
  });
  DOM.geoContainer.appendChild(fragment);
}

function miscellaneous(geoAutoSkipped = false) {
  const geo_on = localStorage.getItem("globalGeo_on");
  currentActiveView = (geo_on == 1) ? 'misc' : 'misc_skipped_geos';


  if (DOM.inputs.ldap) DOM.inputs.ldap.setAttribute('hidden', 'true');
  if (DOM.inputs.car) DOM.inputs.car.setAttribute('hidden', 'true');
  if (DOM.inputs.charge) DOM.inputs.charge.setAttribute('hidden', 'true');

  const misc = parseInt(localStorage.getItem("globalMisc"), 10) || 0;

  if (misc === 1 || misc === 2 || misc === 3 || misc === 4) {
    if (DOM.inputs.car) DOM.inputs.car.removeAttribute('hidden');
  }
  if (misc === 2 || misc === 4) {
    if (DOM.inputs.charge) DOM.inputs.charge.removeAttribute('hidden');
  }
  if (misc === 3 || misc === 4) {
    if (DOM.inputs.ldap) DOM.inputs.ldap.removeAttribute('hidden');
  }

  ['ldap', 'car', 'charge'].forEach(fieldId => {
    const wrapper = DOM.inputs[fieldId];
    if (!wrapper) return;
    const inputElement = wrapper.querySelector('input');
    const storageKey = `global${fieldId.charAt(0).toUpperCase() + fieldId.slice(1)}`;

    if (inputElement) {
      inputElement.value = localStorage.getItem(storageKey) || '';
      if (!inputElement.dataset.hasListener) {
        inputElement.addEventListener('input', (e) => localStorage.setItem(storageKey, e.target.value));
        inputElement.dataset.hasListener = 'true';
      }
    }
  });

  if (DOM.miscFields) DOM.miscFields.removeAttribute('hidden');
}

function resolveLocationMacro(rawLoc) {
  if (!rawLoc) return '';
  const cleanLoc = rawLoc.trim().toLowerCase();

  const savedLocs = localStorage.getItem('customLocations');
  const activeLocations = savedLocs ? JSON.parse(savedLocs) : locations;

  const matchedLoc = activeLocations.find(loc =>
    (loc.label && loc.label.toLowerCase() === cleanLoc) ||
    (loc.className && loc.className.toLowerCase() === cleanLoc)
  );

  return matchedLoc ? matchedLoc.content : `${rawLoc.trim()} `;
}

function autoExtractClipboardData() {
  try {
    const scraper = document.createElement('textarea');
    scraper.style.position = 'fixed';
    scraper.style.opacity = '0';
    document.body.appendChild(scraper);

    scraper.focus();
    const pasteSuccess = document.execCommand('paste');
    const text = scraper.value ? scraper.value.trim() : '';

    document.body.removeChild(scraper);

    if (!pasteSuccess || !text) return;

    let d = '';
    let c = '';
    let p = '';
    let l = '';
    let m = '';

    if (text.includes('|')) {
      const parts = text.split('|');
      d = parts.at(0) ? parts.at(0).trim() : '';
      c = parts.at(1) ? parts.at(1).trim() : '';
      p = parts.at(2) ? parts.at(2).trim() : '';
      l = parts.at(3) ? parts.at(3).trim() : '';
      m = parts.at(4) ? parts.at(4).replace(/_/g, ' ').trim() : '';
    } else {
      const driverMatch = text.match(/Drivers\b\s*[:\-]?\s*([\w\d]+(?:\s*[\/\-]\s*[\w\d]+)*)/i);
      const carMatch = text.match(/Car\s+(\d+)/i);
      const percentMatch = text.match(/(\d{1,3})%/);
      const locMatch = text.match(/Fleet\b\s*[:\-]?\s*([^_\r\n]+)_/i);

      d = driverMatch && driverMatch.at(1) ? driverMatch.at(1).trim() : '';
      c = carMatch && carMatch.at(1) ? carMatch.at(1).trim() : '';
      p = percentMatch && percentMatch.at(1) ? percentMatch.at(1).trim() : '';
      l = locMatch && locMatch.at(1) ? locMatch.at(1).trim() : '';
    }

    if (/^[\s\-\/]+$/.test(d)) {
      d = '';
    }

    // Map clipboard alert aliases to exact template button labels
    const alertAliases = {
      'liberty charge too high': 'Charge Too High'
    };

    if (m && alertAliases[m.toLowerCase()]) {
      m = alertAliases[m.toLowerCase()];
    }

    // If a driver is present, switch these alerts to their Ping templates
    const driverPingMap = {
      'parked in production': 'Parked in Production Ping',
      'very long break': 'Very Long Break Ping',
      'still at shift start location': 'Still at Shift Start Location Ping'
    };

    if (d !== '' && driverPingMap[m.toLowerCase()]) {
      m = driverPingMap[m.toLowerCase()];
    }

    const inputsMap = { ldap: d, car: c, charge: p };
    const storageKeys = { ldap: 'globalLdap', car: 'globalCar', charge: 'globalCharge' };

    Object.keys(inputsMap).forEach(key => {
      const val = inputsMap[key];
      if (val) {
        if (DOM.inputs[key]) {
          const field = DOM.inputs[key].querySelector('input');
          if (field) field.value = val;
        }
        localStorage.setItem(storageKeys[key], val);
      }
    });

    if (l) {
      const resolvedGeo = resolveLocationMacro(l);
      localStorage.setItem('globalGeo', resolvedGeo);
    }

    if (m) {
      localStorage.setItem('globalAutoTemplate', m);
    } else {
      localStorage.removeItem('globalAutoTemplate');
    }

  } catch (err) {
    console.warn('Silent auto-extraction omitted or blocked by host permissions:', err);
  }
}

async function copyRichContent(rawHtmlMsg, plainTextMsg) {
  try {
    const htmlBlob = new Blob([rawHtmlMsg], { type: 'text/html' });
    const textBlob = new Blob([plainTextMsg], { type: 'text/plain' });

    await navigator.clipboard.write([
      new ClipboardItem({
        'text/html': htmlBlob,
        'text/plain': textBlob
      })
    ]);
  } catch (err) {
    // Fallback for auto-triggered copies when Clipboard API rejects lack of click gesture
    const listener = (e) => {
      e.preventDefault();
      if (e.clipboardData) {
        e.clipboardData.setData('text/html', rawHtmlMsg);
        e.clipboardData.setData('text/plain', plainTextMsg);
      }
    };

    document.addEventListener('copy', listener);
    const tempInput = document.createElement('textarea');
    tempInput.value = plainTextMsg;
    tempInput.style.position = 'fixed';
    tempInput.style.opacity = '0';
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);
    document.removeEventListener('copy', listener);
  }
}

async function performCopy(isAutoCopy = false) {
  try {
    ['ldap', 'car', 'charge'].forEach(fieldId => {
      const inputEl = DOM.inputs[fieldId]?.querySelector('input');
      const storageKey = `global${fieldId.charAt(0).toUpperCase() + fieldId.slice(1)}`;
      if (inputEl && inputEl.value.trim() !== '') {
        localStorage.setItem(storageKey, inputEl.value.trim());
      }
    });

    await retreiveGlobalMsg();
    const rawHtmlMsg = localStorage.getItem("globalMsg") || '';

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = rawHtmlMsg;
    const plainTextMsg = tempDiv.textContent || tempDiv.innerText || '';

    await copyRichContent(rawHtmlMsg, plainTextMsg);

    if (DOM.successMsg) {
      DOM.successMsg.removeAttribute('hidden');
      DOM.successMsg.textContent = 'Copied!';
    }

    // Always clear temporary localStorage keys on both manual and auto-copy
    const keysToClean = ['globalLabel', 'globalMisc', 'globalGeo_on', 'globalGeo', 'globalLdap', 'globalCar', 'globalCharge', 'globalMsg'];
    keysToClean.forEach(k => localStorage.removeItem(k));

    // Only clear visible input boxes on manual copy; keep them displayed on auto-copy
    if (!isAutoCopy) {
      Object.keys(DOM.inputs).forEach(key => {
        if (DOM.inputs[key]) {
          const el = DOM.inputs[key].querySelector('input');
          if (el) el.value = '';
        }
      });
    }

    setTimeout(() => {
      if (DOM.successMsg) DOM.successMsg.setAttribute('hidden', 'true');
    }, 2500);

  } catch (err) {
    console.error('Copy metrics compilation loop interrupted:', err);
  }
}



document.addEventListener('DOMContentLoaded', () => {
  const backBtn = document.querySelector('.backBtn');
  const menuDotsBtn = document.getElementById('menu-dots-btn');
  const copyBtn = document.getElementById('copyBtn');

  autoExtractClipboardData();

  if (copyBtn) {
    copyBtn.addEventListener('click', () => performCopy(false));
  }

  if (menuDotsBtn) {
    menuDotsBtn.addEventListener('click', () => {
      chrome.windows.create({
        url: chrome.runtime.getURL("settings.html"),
        type: "popup", width: 920, height: 650, focused: true
      });
    });
  }

  if (backBtn) {
    backBtn.addEventListener('click', () => {
      if (currentActiveView === 'msgs') {
        populateCategories();
      } else if (currentActiveView === 'geos') {
        if (DOM.geoContainer) DOM.geoContainer.setAttribute('hidden', 'true');
        populateMsgsFiltered();
      } else if (currentActiveView === 'misc') {
        if (DOM.miscFields) DOM.miscFields.setAttribute('hidden', 'true');
        populateGeos();
      } else if (currentActiveView === 'misc_skipped_geos') {
        if (DOM.miscFields) DOM.miscFields.setAttribute('hidden', 'true');
        populateMsgsFiltered();
      }
    });
  }

  ['ldap', 'car', 'charge'].forEach(fieldId => {
    const inputEl = DOM.inputs[fieldId]?.querySelector('input');
    if (inputEl) {
      inputEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          performCopy(false);
        }
      });
    }
  });

  document.addEventListener('keydown', (e) => {
    let normalizedKey = e.key.toLowerCase();
    if (e.code.startsWith('Digit')) {
      normalizedKey = e.code.replace('Digit', '');
    } else if (e.code.startsWith('Key')) {
      normalizedKey = e.code.replace('Key', '').toLowerCase();
    }

    const savedData = localStorage.getItem('customMessages');
    const activeMessages = savedData ? JSON.parse(savedData) : messages;

    const matched = activeMessages.find(m => {
      if (!m.hkMod || m.hkMod === 'none' || !m.hkKey) return false;
      if (m.hkKey.toLowerCase() !== normalizedKey) return false;

      if (m.hkMod === 'ctrl') return e.ctrlKey && !e.altKey && !e.shiftKey;
      if (m.hkMod === 'alt') return e.altKey && !e.ctrlKey && !e.shiftKey;
      if (m.hkMod === 'shift') return e.shiftKey && !e.ctrlKey && !e.altKey;
      return false;
    });

    if (matched) {
      e.preventDefault();
      if (!localStorage.getItem('globalCar') && !localStorage.getItem('globalLdap') && !localStorage.getItem('globalCharge') && !localStorage.getItem('globalGeo')) {
        autoExtractClipboardData();
      }
      selectMessageTemplate(matched, true);
    }
  });

  // Auto-select & auto-copy if Car, Location, and Message are in clipboard
  const autoTemplateLabel = localStorage.getItem('globalAutoTemplate');
  const hasCar = Boolean(localStorage.getItem('globalCar'));
  const hasGeo = Boolean(localStorage.getItem('globalGeo'));

  if (autoTemplateLabel) {
    localStorage.removeItem('globalAutoTemplate');
    const savedData = localStorage.getItem('customMessages');
    const activeMessages = savedData ? JSON.parse(savedData) : messages;
    const matchedTemplate = activeMessages.find(
      msg => msg.label.toLowerCase() === autoTemplateLabel.toLowerCase()
    );

    if (matchedTemplate) {
      const canAutoCopy = hasCar && (hasGeo || matchedTemplate.geo_on == 0);
      selectMessageTemplate(matchedTemplate, canAutoCopy);
    } else {
      populateCategories();
    }
  } else {
    populateCategories();
  }
});

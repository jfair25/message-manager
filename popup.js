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

  // Show categories, hide messages list layer
  if (catSection) catSection.removeAttribute('hidden');
  if (msgContainer) msgContainer.setAttribute('hidden', 'true');
  if (backContainer) backContainer.setAttribute('hidden', 'true');

  const containerButtons = document.getElementById('category-buttons');
  if (!containerButtons) return;
  containerButtons.innerHTML = '';

  const savedCats = localStorage.getItem('customCategories');
  const activeCategories = savedCats ? JSON.parse(savedCats) : categories;

  // Document fragment grouping optimization to batch single-pass DOM paints
  const fragment = document.createDocumentFragment();

  activeCategories.forEach((cat, idx) => {
    const button = document.createElement('button');
    button.textContent = cat.label;
    button.className = 'btn category-btn-style';

    // 1. ATTACH DRAG AND DROP CONFIGURATIONS 
    button.draggable = true;

    button.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', idx);
      button.classList.add('dragging');
    });

    button.addEventListener('dragend', () => {
      button.classList.remove('dragging');
    });

    button.addEventListener('dragover', (e) => {
      e.preventDefault(); // Required to unlock dropping frames safely
    });

    button.addEventListener('drop', (e) => {
      e.preventDefault();
      const originIdx = parseInt(e.dataTransfer.getData('text/plain'), 10);
      const destIdx = idx;

      if (originIdx !== destIdx && !isNaN(originIdx)) {
        // Re-arrange the underlying arrays positions mapping layout structure
        const itemToMove = activeCategories[originIdx];
        activeCategories.splice(originIdx, 1);
        activeCategories.splice(destIdx, 0, itemToMove);

        // Push state modification straight into memory and re-paint the buttons loop
        localStorage.setItem('customCategories', JSON.stringify(activeCategories));
        populateCategories();
      }
    });

    // Standard navigation click handler
    button.addEventListener('click', (e) => {
      // Prevent running standard panel click transitions if dropping an item
      if (e.target.classList.contains('dragging')) return;

      if (catSection) catSection.setAttribute('hidden', 'true');
      selectedCategory = cat.id;
      populateMsgsFiltered();
    });

    fragment.appendChild(button);
  });

  DOM.catButtons.appendChild(fragment);
}

function selectMessageTemplate(buttonHash, isHotkey = false) {
  if (DOM.catSection) DOM.catSection.setAttribute('hidden', 'true');
  if (DOM.msgContainer) DOM.msgContainer.setAttribute('hidden', 'true');
  if (DOM.geoContainer) DOM.geoContainer.setAttribute('hidden', 'true');
  if (DOM.miscFields) DOM.miscFields.setAttribute('hidden', 'true');
  if (DOM.backBtnContainer) DOM.backBtnContainer.removeAttribute('hidden');

  selectedCategory = buttonHash.category;
  localStorage.setItem('globalLabel', buttonHash.label);
  localStorage.setItem("globalMisc", buttonHash.misc);
  localStorage.setItem("globalGeo_on", buttonHash.geo_on);

  if (buttonHash.geo_on == 1) {
    populateGeos(isHotkey);
  } else {
    localStorage.setItem("globalGeo", "");
    miscellaneous();
    if (isHotkey) {
      const copyBtn = document.getElementById('copyBtn');
      if (copyBtn) copyBtn.click();
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

    // Display label + optional hotkey badge
    const labelSpan = document.createElement('span');
    labelSpan.textContent = buttonHash.label;
    button.appendChild(labelSpan);

    if (buttonHash.hkMod && buttonHash.hkMod !== 'none' && buttonHash.hkKey) {
      const badge = document.createElement('span');
      badge.className = 'hotkey-badge';
      badge.textContent = `${buttonHash.hkMod.toUpperCase()}+${buttonHash.hkKey.toUpperCase()}`;
      button.appendChild(badge);
    }

    // --- ATTACH DRAG AND DROP HANDLERS TO MESSAGES ---
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
        // Track the targets using global index lookups relative to the master set
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

    // --- ATTACH DRAG AND DROP HANDLERS TO GEOS ---
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
      miscellaneous();
      if (autoCopyAfterGeo) {
        const copyBtn = document.getElementById('copyBtn');
        if (copyBtn) copyBtn.click();
      }
    });
    fragment.appendChild(button);
  });
  DOM.geoContainer.appendChild(fragment);
}

function miscellaneous() {
  const geo_on = localStorage.getItem("globalGeo_on");
  currentActiveView = (geo_on == 1) ? 'misc' : 'misc_skipped_geos';

  if (DOM.inputs.ldap) DOM.inputs.ldap.setAttribute('hidden', 'true');
  if (DOM.inputs.car) DOM.inputs.car.setAttribute('hidden', 'true');
  if (DOM.inputs.charge) DOM.inputs.charge.setAttribute('hidden', 'true');

  const misc = parseInt(localStorage.getItem("globalMisc"), 10) || 0;

  // Clean matching map structure layout conditions
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

function autoExtractClipboardData() {
  try {
    // 1. Build an invisible scratchpad textarea to safely catch system clipboard contents
    const scraper = document.createElement('textarea');
    scraper.style.position = 'fixed';
    scraper.style.opacity = '0';
    document.body.appendChild(scraper);

    // 2. Programmatically shift browser focus onto the node and fire a native paste command
    scraper.focus();
    const pasteSuccess = document.execCommand('paste');
    const text = scraper.value ? scraper.value.trim() : '';

    document.body.removeChild(scraper);

    if (!pasteSuccess || !text) return;

    let d = '';
    let c = '';
    let p = '';

    // 3. Parse data using your custom delimiter or regex match rules
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

    // 4. Inject parsed parameters straight into DOM node cache wrappers
    const inputsMap = { ldap: d, car: c, charge: p };
    const storageKeys = { ldap: 'globalLdap', car: 'globalCar', charge: 'globalCharge' };

    Object.keys(inputsMap).forEach(key => {
      const val = inputsMap[key];
      if (val && DOM.inputs[key]) {
        const field = DOM.inputs[key].querySelector('input');
        if (field) field.value = val;
        localStorage.setItem(storageKeys[key], val);
      }
    });

  } catch (err) {
    console.warn('Silent auto-extraction omitted or blocked by host permissions:', err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const backBtn = document.querySelector('.backBtn');
  const menuDotsBtn = document.getElementById('menu-dots-btn');
  const copyBtn = document.getElementById('copyBtn');

  autoExtractClipboardData();

  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      try {
        // Sync any visible input values straight to localStorage right before building the message
        ['ldap', 'car', 'charge'].forEach(fieldId => {
          const inputEl = DOM.inputs[fieldId]?.querySelector('input');
          const storageKey = `global${fieldId.charAt(0).toUpperCase() + fieldId.slice(1)}`;
          if (inputEl && inputEl.value.trim() !== '') {
            localStorage.setItem(storageKey, inputEl.value.trim());
          }
        });

        await retreiveGlobalMsg();
        const rawHtmlMsg = localStorage.getItem("globalMsg") || '';

        // Create a clean plain-text fallback by stripping HTML tags
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = rawHtmlMsg;
        const plainTextMsg = tempDiv.textContent || tempDiv.innerText || '';

        const htmlBlob = new Blob([rawHtmlMsg], { type: 'text/html' });
        const textBlob = new Blob([plainTextMsg], { type: 'text/plain' });

        await navigator.clipboard.write([
          new ClipboardItem({
            'text/html': htmlBlob,
            'text/plain': textBlob
          })
        ]);

        if (DOM.successMsg) {
          DOM.successMsg.removeAttribute('hidden');
          DOM.successMsg.textContent = 'Copied!';
        }

        const keysToClean = ['globalLabel', 'globalMisc', 'globalGeo_on', 'globalGeo', 'globalLdap', 'globalCar', 'globalCharge', 'globalMsg'];
        keysToClean.forEach(k => localStorage.removeItem(k));

        Object.keys(DOM.inputs).forEach(key => {
          if (DOM.inputs[key]) {
            const el = DOM.inputs[key].querySelector('input');
            if (el) el.value = '';
          }
        });

        setTimeout(() => {
          if (DOM.successMsg) DOM.successMsg.setAttribute('hidden', 'true');
        }, 2500);

      } catch (err) {
        console.error('Copy metrics compilation loop interrupted:', err);
      }
    });
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

  // Allow pressing Enter inside input fields to trigger Copy
  ['ldap', 'car', 'charge'].forEach(fieldId => {
    const inputEl = DOM.inputs[fieldId]?.querySelector('input');
    if (inputEl) {
      inputEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && copyBtn) {
          e.preventDefault();
          copyBtn.click();
        }
      });
    }
  });

  // Global Hotkey Listener
  document.addEventListener('keydown', (e) => {
    // Normalize key using e.code so Shift+2 still matches "2" and Alt+A matches "a"
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
      // Ensure clipboard extraction has populated Car #, Driver LDAP, and Charge % before building
      if (!localStorage.getItem('globalCar') && !localStorage.getItem('globalLdap') && !localStorage.getItem('globalCharge')) {
        autoExtractClipboardData();
      }
      selectMessageTemplate(matched, true);
    }
  });

  populateCategories();
});


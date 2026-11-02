import { locations } from './master.js';
import { messages } from './master.js';
import { retreiveGlobalMsg } from './master.js';

// Centralized navigation tracker to map which layout panel sits behind the back button
let currentActiveView = 'msgs';

async function scanActivePageContent() {
  try {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!activeTab || !activeTab.id) return;

    const [results] = await chrome.scripting.executeScript({
      target: { tabId: activeTab.id },
      func: () => document.body.innerText
    });

    if (!results || !results.result) return;
    const pagePlainText = results.result;

    const ldapMatch = pagePlainText.match(/(?:Drivers|LDAP|Operator):\s*([a-zA-Z0-9_\-\.\s\/]+)/i);
    const carMatch = pagePlainText.match(/(?:Car|Vehicle|Unit)\s*(?:#|No\.?)?\s*:?\s*(\d+)/i);
    const chargeMatch = pagePlainText.match(/(\d+)\s*%/);

    if (ldapMatch && ldapMatch[1]) {
      let cleanedLdap = ldapMatch[1].trim();
      
      // Strip any car details that bled into the line
      cleanedLdap = cleanedLdap.replace(/\s*car\s*.*$/i, '');
      
      // Clean trailing slashes, dashes, and whitespace
      cleanedLdap = cleanedLdap.replace(/\s*[\/\-]\s*[\-]*\s*$/, '').trim();
      
      localStorage.setItem('globalLdap', cleanedLdap);
    } else {
      localStorage.setItem('globalLdap', '');
    }

    if (carMatch && carMatch[1]) {
      localStorage.setItem('globalCar', carMatch[1].trim());
    } else {
      localStorage.setItem('globalCar', '');
    }

    if (chargeMatch && chargeMatch[1]) {
      localStorage.setItem('globalCharge', chargeMatch[1].trim());
    } else {
      localStorage.setItem('globalCharge', '');
    }

    // Reflect changes into the DOM conditional layouts
    const ldapWrapper = document.getElementById('ldap');
    const carWrapper = document.getElementById('car');
    const chargeWrapper = document.getElementById('charge');

    const ldapInput = ldapWrapper ? ldapWrapper.querySelector('input, select') : null;
    const carInput = carWrapper ? carWrapper.querySelector('input, select') : null;
    const chargeInput = chargeWrapper ? chargeWrapper.querySelector('input, select') : null;

    if (ldapInput) ldapInput.value = localStorage.getItem('globalLdap') || '';
    if (carInput) carInput.value = localStorage.getItem('globalCar') || '';
    if (chargeInput) chargeInput.value = localStorage.getItem('globalCharge') || '';

    console.table(localStorage);

  } catch (error) {
    console.error("Text extraction matrix failure:", error);
  }
}




// Function to generate and insert message buttons
function populateMsgs(containerId) {
  currentActiveView = 'msgs';
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  container.removeAttribute('hidden');

  const savedData = localStorage.getItem('customMessages');
  const activeMessages = savedData ? JSON.parse(savedData) : messages;

  activeMessages.forEach(buttonHash => {
    const button = document.createElement('button');
    button.textContent = buttonHash.label;
    button.className = `btn ${buttonHash.className}`;
    button.dataset.content = buttonHash.content;
    button.addEventListener('click', () => {
      container.hidden = true;
      localStorage.setItem('globalLabel', buttonHash.label);
      localStorage.setItem("globalMisc", buttonHash.misc);
      localStorage.setItem("globalGeo_on", buttonHash.geo_on);
      handleMsgButtonClick(buttonHash.label);
    });
    container.appendChild(button);
  });
}

// Function to generate and insert geo location buttons
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

  activeLocations.forEach(buttonHash => {
    const button = document.createElement('button');
    button.textContent = buttonHash.label;
    button.className = `btn ${buttonHash.className}`;
    button.dataset.content = buttonHash.content;
    button.addEventListener('click', () => {
      container.hidden = true;
      localStorage.setItem("globalGeo", buttonHash.content);
      handleGeoButtonClick(buttonHash.content);
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

  ldapContainer.hidden = true;
  carContainer.hidden = true;
  chargeContainer.hidden = true;

  const misc = localStorage.getItem("globalMisc");

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

function handleMsgButtonClick(content) {
  populateGeos('geo-buttons');
}

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

export function launchMessagesSettingsPanel() {
  let settingsOverlay = document.getElementById('global-settings-modal');
  if (!settingsOverlay) {
    settingsOverlay = document.createElement('div');
    settingsOverlay.id = 'global-settings-modal';
    Object.assign(settingsOverlay.style, {
      position: 'fixed',
      top: '12px',
      left: '12px',
      right: '12px',
      bottom: '12px',
      backgroundColor: '#282d3a',
      color: '#f9fafb',
      padding: '20px',
      borderRadius: '12px',
      boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
      zIndex: '2000000',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      boxSizing: 'border-box',
      overflowY: 'auto',
      border: '1px solid #374151',
    });
    document.body.appendChild(settingsOverlay);
  }

  const stored = localStorage.getItem('customMessages');
  let runtimeCollection = stored ? JSON.parse(stored) : [...messages];

  const storedLocs = localStorage.getItem('customLocations');
  let runtimeLocations = storedLocs ? JSON.parse(storedLocs) : [...locations];

  settingsOverlay.innerHTML = `
    <div style="display: flex; gap: 8px; margin-bottom: 20px; background: #1e222b; padding: 4px; border-radius: 8px; border: 1px solid #374151;">
      <button type="button" id="tab-btn-msgs" style="flex: 1; height: 32px; font-size: 12px; font-weight: 600; background: #4f46e5; color: white; border: none; border-radius: 6px; cursor: pointer;">✉️ Messages</button>
      <button type="button" id="tab-btn-locs" style="flex: 1; height: 32px; font-size: 12px; font-weight: 600; background: transparent; color: #9ca3af; border: none; border-radius: 6px; cursor: pointer;">📍 Locations</button>
    </div>
    <div id="settings-panel-msgs">
      <div style="display:flex; justify-content:space-between; align-items: center; margin-bottom: 16px;">
        <span style="font-weight: 700; font-size: 14px; color: #ffffff;">Message Card Configurations</span>
        <button type="button" id="modal-create-btn" style="background-color:#10b981; border:none; color:#ffffff; font-size:11px; font-weight:700; padding:6px 12px; border-radius:6px; width:auto; height:28px;">➕ Add Card</button>
      </div>
      <div style="margin-bottom: 16px;">
        <label style="display:block; font-size:11px; font-weight:700; text-transform:uppercase; margin-bottom:6px; color:#9ca3af;">Select Message Row to Modify</label>
        <select id="modal-msg-selector" style="width:100%; padding:10px; font-size:13px; border-radius:8px; border:1px solid #374151; background-color:#1e222b; color:#fff; outline:none;"></select>
      </div>


    <!-- MESSAGES MANAGEMENT TAB PANEL CONTENT MODULE -->
    <div id="settings-panel-msgs">
      <div style="display:flex; justify-content:space-between; align-items: center; margin-bottom: 16px;">
        <span style="font-weight: 700; font-size: 14px; letter-spacing: -0.01em; color: #ffffff;">Message Card Configurations</span>
        <button type="button" id="modal-create-btn" style="background-color:#10b981; border:none; color:#ffffff; font-size:11px; font-weight:700; cursor:pointer; padding:6px 12px; border-radius:6px; width:auto; height:28px;">➕ Add Card</button>
      </div>
      <div style="margin-bottom: 16px;">
        <label style="display:block; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.04em; margin-bottom:6px; color:#9ca3af;">Select Message Row to Modify</label>
        <select id="modal-msg-selector" style="width:100%; padding:10px; font-size:13px; border-radius:8px; border:1px solid #374151; background-color:#1e222b; color:#fff; font-family:sans-serif; outline:none;"></select>
      </div>
      <div id="modal-editor-fields" style="background:#1e222b; padding:16px; border-radius:10px; border:1px solid #374151; margin-bottom:16px;"></div>
    </div>

    <!-- GEOGRAPHIC LOCATIONS TAB PANEL CONTENT MODULE -->
    <div id="settings-panel-locs" style="display: none;">
      <div style="display:flex; justify-content:space-between; align-items: center; margin-bottom: 16px;">
        <span style="font-weight: 700; font-size: 14px; letter-spacing: -0.01em; color: #ffffff;">Location Map Reference Markers</span>
        <button type="button" id="modal-loc-create-btn" style="background-color:#10b981; border:none; color:#ffffff; font-size:11px; font-weight:700; cursor:pointer; padding:6px 12px; border-radius:6px; width:auto; height:28px;">➕ Add Location</button>
      </div>
      <div style="margin-bottom: 16px;">
        <label style="display:block; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.04em; margin-bottom:6px; color:#9ca3af;">Select Location Row to Modify</label>
        <select id="modal-loc-selector" style="width:100%; padding:10px; font-size:13px; border-radius:8px; border:1px solid #374151; background-color:#1e222b; color:#fff; font-family:sans-serif; outline:none;"></select>
      </div>
      <div id="modal-loc-editor-fields" style="background:#1e222b; padding:16px; border-radius:10px; border:1px solid #374151; margin-bottom:16px;"></div>
    </div>

    <!-- FOOTER PANEL ACTIONS HUD ACTION BAR -->
    <div style="display: flex; gap: 10px; justify-content: flex-end; padding-top: 14px; border-top: 1px solid #374151; margin-top: 20px;">
      <button id="modal-cancel-btn" style="padding: 0 16px; width:auto; height: 36px; font-size: 12px; font-weight:600; border: 1px solid #374151; background: transparent; color:#9ca3af; border-radius: 6px; cursor: pointer;">Cancel</button>
      <button id="modal-save-btn" style="padding: 0 16px; width:auto; height: 36px; font-size: 12px; font-weight:600; border: none; background: #4f46e5; color: #fff; border-radius: 6px; cursor: pointer; box-shadow: 0 2px 6px rgba(79,70,229,0.3);">Save Changes</button>
    </div>
  `;
  const msgSelector = document.getElementById('modal-msg-selector');
  const locSelector = document.getElementById('modal-loc-selector');
  const panelMsgs = document.getElementById('settings-panel-msgs');
  const panelLocs = document.getElementById('settings-panel-locs');
  const tabBtnMsgs = document.getElementById('tab-btn-msgs');
  const tabBtnLocs = document.getElementById('tab-btn-locs');

  let activeMsgIndex = 0;
  let activeLocIndex = 0;

  function stashActiveMsgChanges() {
    if (runtimeCollection.length === 0 || activeMsgIndex >= runtimeCollection.length) return;
    const lbl = document.getElementById('m-field-lbl');
    const geo = document.getElementById('m-toggle-geo');
    const misc = document.getElementById('m-field-misc');
    const cnt = document.getElementById('m-field-cnt');

    if (lbl) runtimeCollection[activeMsgIndex].label = lbl.value.trim() || `Button #${activeMsgIndex + 1}`;
    if (geo) runtimeCollection[activeMsgIndex].geo_on = geo.dataset.state;
    if (misc) runtimeCollection[activeMsgIndex].misc = misc.value;
    if (cnt) runtimeCollection[activeMsgIndex].content = cnt.value.trim();
  }

  function stashActiveLocChanges() {
    if (runtimeLocations.length === 0 || activeLocIndex >= runtimeLocations.length) return;
    const lbl = document.getElementById('l-field-lbl');
    const cnt = document.getElementById('l-field-cnt');

    if (lbl) runtimeLocations[activeLocIndex].label = lbl.value.trim() || `Location #${activeLocIndex + 1}`;
    if (cnt) runtimeLocations[activeLocIndex].content = cnt.value.trim();
  }

  function populateMsgDropdown(targetIdx) {
    msgSelector.innerHTML = '';
    runtimeCollection.forEach((msg, idx) => {
      const opt = document.createElement('option');
      opt.value = idx;
      opt.textContent = msg.label || `[Blank Card Row #${idx + 1}]`;
      if (idx === targetIdx) opt.selected = true;
      msgSelector.appendChild(opt);
    });
    activeMsgIndex = targetIdx;
  }

  function determineLocationClassName(labelString) {
    const dynamicSanitized = labelString.replace(/[^a-zA-Z\s]/g, '').trim().toUpperCase();
    if (!dynamicSanitized) return "LOC";
    return dynamicSanitized.substring(0, 3);
  }

  function populateLocDropdown(targetIdx) {
    locSelector.innerHTML = '';
    runtimeLocations.forEach((loc, idx) => {
      const opt = document.createElement('option');
      opt.value = idx;
      opt.textContent = loc.label || `[Blank Location Row #${idx + 1}]`;
      if (idx === targetIdx) opt.selected = true;
      locSelector.appendChild(opt);
    });
    activeLocIndex = targetIdx;
  }
  function refreshMsgForm() {
    if (runtimeCollection.length === 0) {
      document.getElementById('modal-editor-fields').innerHTML = `<div style="font-size:12px; color:#9ca3af; text-align:center; padding:20px;">No active messages found.</div>`;
      return;
    }
    activeMsgIndex = parseInt(msgSelector.value, 10);
    const item = runtimeCollection[activeMsgIndex];

    document.getElementById('modal-editor-fields').innerHTML = `
      <div style="margin-bottom: 12px;">
        <label style="display:block; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.04em; margin-bottom:6px; color:#9ca3af;">Button Name</label>
        <input type="text" id="m-field-lbl" value="${item.label}" style="width:100%; box-sizing:border-box; padding:8px 12px; font-size:13px; border:1px solid #374151; border-radius:6px; background-color:#282d3a; color:#fff; outline:none;">
      </div>
      <div style="margin-bottom: 12px;">
        <label style="display:block; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.04em; margin-bottom:6px; color:#9ca3af;">Geographic Panel Step</label>
        <button type="button" id="m-toggle-geo" data-state="${item.geo_on == '1' ? '1' : '0'}" style="width:100%; height:34px; font-size:12px; border-radius:6px; font-weight:700; cursor:pointer; text-align:center; transition:all 0.15s;"></button>
      </div>
      <div style="margin-bottom: 14px;">
        <label style="display:block; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.04em; margin-bottom:6px; color:#9ca3af;">Conditional Input Fields</label>
        <select id="m-field-misc" style="width:100%; padding:8px 12px; font-size:13px; border:1px solid #374151; border-radius:6px; background-color:#282d3a; color:#fff; outline:none; font-family:sans-serif;">
          <option value="0" ${item.misc == "0" ? 'selected' : ''}>None (Copy Immediately)</option>
          <option value="1" ${item.misc == "1" ? 'selected' : ''}>Car Number Only</option>
          <option value="2" ${item.misc == "2" ? 'selected' : ''}>Car Number + Charge %</option>
          <option value="3" ${item.misc == "3" ? 'selected' : ''}>Car Number + Driver LDAP</option>
          <option value="4" ${item.misc == "4" ? 'selected' : ''}>Car Number + Driver LDAP + Charge %</option>
        </select>
      </div>
      <div style="margin-bottom: 14px;">
        <label style="display:block; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.04em; margin-bottom:6px; color:#9ca3af;">Template Content Text</label>
        <textarea id="m-field-cnt" rows="4" style="width:100%; box-sizing:border-box; padding:8px 12px; font-size:12px; border:1px solid #374151; border-radius:6px; background-color:#282d3a; color:#fff; font-family:monospace; resize:vertical; outline:none; line-height:1.5;">${item.content || ''}</textarea>
      </div>
      <button type="button" id="modal-delete-btn" style="background-color:#ef4444; border:none; color:white; font-size:12px; font-weight:600; cursor:pointer; padding:0 12px; border-radius:6px; width:auto; height:32px; margin-top:4px;">🗑️ Delete Message</button>
    `;

    const geoToggleBtn = document.getElementById('m-toggle-geo');
    function updateToggleUI(state) {
      if (state === "1") {
        geoToggleBtn.textContent = "📍 Geo Panel: ENABLED";
        geoToggleBtn.style.backgroundColor = "#10b981";
        geoToggleBtn.style.color = "#ffffff";
        geoToggleBtn.style.border = "none";
        geoToggleBtn.dataset.state = "1";
      } else {
        geoToggleBtn.textContent = "⏭️ Geo Panel: SKIPPED";
        geoToggleBtn.style.backgroundColor = "#374151";
        geoToggleBtn.style.color = "#9ca3af";
        geoToggleBtn.style.border = "1px solid #4b5563";
        geoToggleBtn.dataset.state = "0";
      }
    }
    updateToggleUI(geoToggleBtn.dataset.state);
    geoToggleBtn.addEventListener('click', () => {
      updateToggleUI(geoToggleBtn.dataset.state === "1" ? "0" : "1");
    });

    document.getElementById('modal-delete-btn').addEventListener('click', () => {
      runtimeCollection.splice(activeMsgIndex, 1);
      populateMsgDropdown(Math.max(0, activeMsgIndex - 1));
      refreshMsgForm();
    });
  }

  function refreshLocForm() {
    if (runtimeLocations.length === 0) {
      document.getElementById('modal-loc-editor-fields').innerHTML = `<div style="font-size:12px; color:#9ca3af; text-align:center; padding:20px;">No active locations found.</div>`;
      return;
    }
    activeLocIndex = parseInt(locSelector.value, 10);
    const item = runtimeLocations[activeLocIndex];

    document.getElementById('modal-loc-editor-fields').innerHTML = `
      <div style="margin-bottom: 12px;">
        <label style="display:block; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.04em; margin-bottom:6px; color:#9ca3af;">Location Label Name</label>
        <input type="text" id="l-field-lbl" value="${item.label || ''}" style="width:100%; box-sizing:border-box; padding:8px 12px; font-size:13px; border:1px solid #374151; border-radius:6px; background-color:#282d3a; color:#fff; outline:none;">
      </div>
      <div style="margin-bottom: 14px;">
        <label style="display:block; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.04em; margin-bottom:6px; color:#9ca3af;">Macro Replacement Value ({geo})</label>
        <input type="text" id="l-field-cnt" value="${item.content || ''}" style="width:100%; box-sizing:border-box; padding:8px 12px; font-size:13px; border:1px solid #374151; border-radius:6px; background-color:#282d3a; color:#fff; outline:none;">
      </div>
      <button type="button" id="modal-loc-delete-btn" style="background-color:#ef4444; border:none; color:white; font-size:12px; font-weight:600; cursor:pointer; padding:0 12px; border-radius:6px; width:auto; height:32px; margin-top:4px;">🗑️ Delete Location</button>
    `;

    document.getElementById('modal-loc-delete-btn').addEventListener('click', () => {
      runtimeLocations.splice(activeLocIndex, 1);
      populateLocDropdown(Math.max(0, activeLocIndex - 1));
      refreshLocForm();
    });
  }
  tabBtnMsgs.addEventListener('click', () => {
    stashActiveLocChanges();
    tabBtnMsgs.style.background = '#4f46e5'; tabBtnMsgs.style.color = 'white';
    tabBtnLocs.style.background = 'transparent'; tabBtnLocs.style.color = '#9ca3af';
    panelMsgs.style.display = 'block'; panelLocs.style.display = 'none';
    refreshMsgForm();
  });

  tabBtnLocs.addEventListener('click', () => {
    stashActiveMsgChanges();
    tabBtnLocs.style.background = '#4f46e5'; tabBtnLocs.style.color = 'white';
    tabBtnMsgs.style.background = 'transparent'; tabBtnMsgs.style.color = '#9ca3af';
    panelLocs.style.display = 'block'; panelMsgs.style.display = 'none';
    refreshLocForm();
  });

  document.getElementById('modal-create-btn').addEventListener('click', () => {
    stashActiveMsgChanges();
    runtimeCollection.push({ label: "Custom Message " + (runtimeCollection.length + 1), className: "Custom", misc: "0", geo_on: "0", content: "{geo}<b>Custom text</b> for car#{car}." });
    populateMsgDropdown(runtimeCollection.length - 1); refreshMsgForm();
  });

  document.getElementById('modal-loc-create-btn').addEventListener('click', () => {
    stashActiveLocChanges();
    runtimeLocations.push({ label: "New City " + (runtimeLocations.length + 1), className: "NEW_LOC", content: "<b>NEW AVOS</b>- " });
    populateLocDropdown(runtimeLocations.length - 1); refreshLocForm();
  });

  msgSelector.addEventListener('change', () => { stashActiveMsgChanges(); refreshMsgForm(); });
  locSelector.addEventListener('change', () => { stashActiveLocChanges(); refreshLocForm(); });

  populateMsgDropdown(0); refreshMsgForm();
  populateLocDropdown(0); refreshLocForm();

  document.getElementById('modal-save-btn').addEventListener('click', () => {
    stashActiveMsgChanges();
    stashActiveLocChanges();

    runtimeLocations.forEach(loc => {
      if (loc.className === "NEW_LOC" || !loc.className) {
        loc.className = determineLocationClassName(loc.label);
      }
    });

    localStorage.setItem('customMessages', JSON.stringify(runtimeCollection));
    localStorage.setItem('customLocations', JSON.stringify(runtimeLocations));

    settingsOverlay.remove();
    populateMsgs('msg-buttons');
  });

  document.getElementById('modal-cancel-btn').addEventListener('click', () => settingsOverlay.remove());
}


// Setup Application Lifecycle Hooks
document.addEventListener('DOMContentLoaded', () => {
  const backBtn = document.querySelector('.backBtn');
  const copyBtn = document.getElementById('copyBtn');
  const backContainer = document.getElementById('back');



  const extractBtn = document.getElementById('extract-btn');
  if (extractBtn) {
    extractBtn.addEventListener('click', scanActivePageContent);
    console.table(localStorage);

  }


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

        console.table(localStorage);

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
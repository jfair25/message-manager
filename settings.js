import { categories, locations, messages } from './messages.js';

let runtimeCategories = [];
let runtimeCollection = [];
let runtimeLocations = [];

let activeCatIndex = 0;
let activeMsgIndex = 0;
let activeLocIndex = 0;

// Shared structural reordering lifecycle handlers pipeline
function bindDragLifecycleHandlers(element, index, dataArray, storageKey, rebuildCallback) {
  element.draggable = true;

  element.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('text/plain', index);
    element.classList.add('dragging-state');
  });

  element.addEventListener('dragend', () => element.classList.remove('dragging-state'));
  element.addEventListener('dragover', (e) => e.preventDefault());

  element.addEventListener('drop', (e) => {
    e.preventDefault();
    const sourceIdx = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (sourceIdx !== index && !isNaN(sourceIdx)) {
      const movedItem = dataArray[sourceIdx];
      dataArray.splice(sourceIdx, 1);
      dataArray.splice(index, 0, movedItem);
      localStorage.setItem(storageKey, JSON.stringify(dataArray));
      rebuildCallback();
    }
  });
}

// Helper to minimize DOM paint overheads across all lists templates
function buildListDOM(containerId, dataArray, activeIndex, storageKey, onRowClick, rebuildCallback) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';

  const fragment = document.createDocumentFragment();
  dataArray.forEach((item, idx) => {
    const row = document.createElement('div');
    row.className = `drag-item-row ${idx === activeIndex ? 'selected-active' : ''}`;
    row.textContent = item.label || `[Blank Entry #${idx + 1}]`;

    row.addEventListener('click', () => onRowClick(idx));
    bindDragLifecycleHandlers(row, idx, dataArray, storageKey, rebuildCallback);
    fragment.appendChild(row);
  });
  container.appendChild(fragment);
}

// Helper to configure visual rich-text boxes (Ctrl+B without raw HTML tags)
function setupRichEditor(element, onUpdateCallback, singleLine = false) {
  if (!element) return;

  // 1. Sync rich HTML content whenever the user types or formats text
  element.addEventListener('input', () => {
    onUpdateCallback(element.innerHTML);
  });

  // 2. Ensure Ctrl+B / Cmd+B toggles bold visually and triggers state sync
  element.addEventListener('keydown', (e) => {
    if (singleLine && e.key === 'Enter') {
      e.preventDefault();
      return;
    }

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
      e.preventDefault();
      document.execCommand('bold', false, null);
      onUpdateCallback(element.innerHTML);
    }
  });

  // 3. Strip external messy styles when pasting text into the editor
  element.addEventListener('paste', (e) => {
    e.preventDefault();
    const plainText = (e.clipboardData || window.clipboardData).getData('text/plain');
    document.execCommand('insertText', false, plainText);
  });
}

// --------------------------------------------------------
// CATEGORIES HUB
// --------------------------------------------------------
function populateCatList() {
  buildListDOM('custom-cat-list', runtimeCategories, activeCatIndex, 'customCategories', (idx) => {
    activeCatIndex = idx;
    populateCatList();
    refreshCatForm();
  }, () => {
    populateCatList();
    refreshCatForm();
  });
}

function refreshCatForm() {
  const container = document.getElementById('modal-cat-editor-fields');
  if (!container) return;
  if (runtimeCategories.length === 0) {
    container.innerHTML = `<div style="font-size:12px; color:#9ca3af; text-align:center; padding:20px;">No categories found.</div>`;
    return;
  }
  container.innerHTML = `
    <div style="margin-bottom: 12px;">
      <label>Category Label Name</label>
      <input type="text" id="c-field-lbl" value="${runtimeCategories[activeCatIndex].label || ''}">
    </div>
    <button type="button" id="modal-cat-delete-btn" style="background-color:#ef4444; color:white; border:none; padding:8px 14px; border-radius:6px; margin-top:12px; cursor:pointer;">🗑️ Delete Category</button>
  `;

  document.getElementById('c-field-lbl').addEventListener('input', (e) => {
    const newName = e.target.value.trim();
    runtimeCategories[activeCatIndex].label = newName;
    const activeRow = document.querySelector('#custom-cat-list .selected-active');
    if (activeRow) activeRow.textContent = newName || `[Blank Entry #${activeCatIndex + 1}]`;
  });

  document.getElementById('modal-cat-delete-btn').addEventListener('click', () => {
    runtimeCategories.splice(activeCatIndex, 1);
    activeCatIndex = Math.max(0, activeCatIndex - 1);
    populateCatList();
    refreshCatForm();
  });
}

// --------------------------------------------------------
// MESSAGES HUB
// --------------------------------------------------------
function populateMsgList() {
  buildListDOM('custom-msg-list', runtimeCollection, activeMsgIndex, 'customMessages', (idx) => {
    activeMsgIndex = idx;
    populateMsgList();
    refreshMsgForm();
  }, () => {
    populateMsgList();
    refreshMsgForm();
  });
}

function refreshMsgForm() {
  const container = document.getElementById('modal-editor-fields');
  if (!container) return;
  if (runtimeCollection.length === 0) {
    container.innerHTML = `<div style="font-size:12px; color:#9ca3af; text-align:center; padding:20px;">No messages found.</div>`;
    return;
  }
  const item = runtimeCollection[activeMsgIndex];
  const currentMod = item.hkMod || 'none';
  const currentKey = item.hkKey || '';

  container.innerHTML = `
    <div style="margin-bottom: 12px;">
      <label>Button Name</label>
      <input type="text" id="m-field-lbl" value="${item.label || ''}">
    </div>
    <div style="margin-bottom: 14px;">
      <label>Assigned Category Group</label>
      <select id="m-field-category">
        ${runtimeCategories.map(c => `<option value="${c.id}" ${item.category === c.id ? 'selected' : ''}>${c.label}</option>`).join('')}
      </select>
    </div>
    <div style="margin-bottom: 14px;">
      <label>Keyboard Shortcut (Popup Hotkey)</label>
      <div style="display: grid; grid-template-columns: 1fr 1fr auto; gap: 8px; align-items: center;">
        <select id="m-field-hkmod">
          <option value="none" ${currentMod === 'none' ? 'selected' : ''}>None (Disabled)</option>
          <option value="ctrl" ${currentMod === 'ctrl' ? 'selected' : ''}>Ctrl +</option>
          <option value="alt" ${currentMod === 'alt' ? 'selected' : ''}>Alt +</option>
          <option value="shift" ${currentMod === 'shift' ? 'selected' : ''}>Shift +</option>
        </select>
        <input type="text" id="m-field-hkkey" maxlength="1" placeholder="Key (e.g. 2)" value="${currentKey}" ${currentMod === 'none' ? 'disabled' : ''}>
        <button type="button" id="m-clear-hk-btn" title="Remove Hotkey" style="background-color: var(--bg-card); border: 1px solid var(--border-color); color: var(--text-secondary); padding: 0 12px; height: 38px;">Clear</button>
      </div>
    </div>
    <div style="margin-bottom: 12px;">
      <label>Geographic Panel Step</label>
      <div class="switch-wrapper">
        <span class="switch-label-text" id="switch-status-text">Skipped</span>
        <button type="button" class="toggle-switch-btn" id="m-toggle-geo" data-state="${item.geo_on == '1' ? '1' : '0'}"></button>
      </div>
    </div>
    <div style="margin-bottom: 14px;">
      <label>Conditional Input Fields</label>
      <select id="m-field-misc">
        <option value="0" ${item.misc == "0" ? 'selected' : ''}>None (Copy Immediately)</option>
        <option value="1" ${item.misc == "1" ? 'selected' : ''}>Car Number Only</option>
        <option value="2" ${item.misc == "2" ? 'selected' : ''}>Car Number + Charge %</option>
        <option value="3" ${item.misc == "3" ? 'selected' : ''}>Car Number + Driver LDAP</option>
        <option value="4" ${item.misc == "4" ? 'selected' : ''}>Car Number + Driver LDAP + Charge %</option>
      </select>
    </div>
    <div style="margin-bottom: 14px;">
      <label>Template Content Text (Highlight & press Ctrl + B to bold)</label>
      <div>{geo} for Location, {ldap} for LDAP, {date} for Todays Date</div>
      <div id="m-field-cnt" class="rich-editor rich-editor-area" contenteditable="true" data-placeholder="Enter message template..."></div>
    </div>
    <button type="button" id="modal-delete-btn" style="background-color:#ef4444; color:white; border:none; padding:8px 14px; border-radius:6px; cursor:pointer;">🗑️ Delete Message</button>
  `;

  document.getElementById('m-field-lbl').addEventListener('input', (e) => {
    const newName = e.target.value.trim();
    runtimeCollection[activeMsgIndex].label = newName;
    const activeRow = document.querySelector('#custom-msg-list .selected-active');
    if (activeRow) activeRow.textContent = newName || `[Blank Entry #${activeMsgIndex + 1}]`;
  });

  // Hotkey Listeners
  const hkModSelect = document.getElementById('m-field-hkmod');
  const hkKeyInput = document.getElementById('m-field-hkkey');
  const clearHkBtn = document.getElementById('m-clear-hk-btn');

  hkModSelect.addEventListener('change', (e) => {
    const mod = e.target.value;
    runtimeCollection[activeMsgIndex].hkMod = mod;
    if (mod === 'none') {
      runtimeCollection[activeMsgIndex].hkKey = '';
      hkKeyInput.value = '';
      hkKeyInput.disabled = true;
    } else {
      hkKeyInput.disabled = false;
      hkKeyInput.focus();
    }
  });

  hkKeyInput.addEventListener('input', (e) => {
    const cleanKey = e.target.value.trim().toLowerCase();
    e.target.value = cleanKey;
    runtimeCollection[activeMsgIndex].hkKey = cleanKey;
  });

  clearHkBtn.addEventListener('click', () => {
    runtimeCollection[activeMsgIndex].hkMod = 'none';
    runtimeCollection[activeMsgIndex].hkKey = '';
    hkModSelect.value = 'none';
    hkKeyInput.value = '';
    hkKeyInput.disabled = true;
  });

  const liveFields = { category: 'm-field-category', misc: 'm-field-misc' };
  Object.keys(liveFields).forEach(key => {
    document.getElementById(liveFields[key]).addEventListener('change', (e) => {
      runtimeCollection[activeMsgIndex][key] = e.target.value;
    });
  });

  // Initialize visual rich-text editor for Template Content
  const msgEditor = document.getElementById('m-field-cnt');
  msgEditor.innerHTML = (item.content || '').replace(/\n/g, '<br>');
  setupRichEditor(msgEditor, (updatedHtml) => {
    runtimeCollection[activeMsgIndex].content = updatedHtml;
  }, false);

  const geoToggleBtn = document.getElementById('m-toggle-geo');
  const switchStatusText = document.getElementById('switch-status-text');

  const updateToggleUI = (state) => {
    const isEnabled = state === "1";
    geoToggleBtn.dataset.state = isEnabled ? "1" : "0";
    switchStatusText.textContent = isEnabled ? "Enabled" : "Skipped";
    switchStatusText.style.color = isEnabled ? "#10b981" : "#9ca3af";
  };

  if (geoToggleBtn) {
    updateToggleUI(item.geo_on);
    geoToggleBtn.addEventListener('click', () => {
      const newState = geoToggleBtn.dataset.state === "1" ? "0" : "1";
      updateToggleUI(newState);
      runtimeCollection[activeMsgIndex].geo_on = newState;
    });
  }

  document.getElementById('modal-delete-btn').addEventListener('click', () => {
    runtimeCollection.splice(activeMsgIndex, 1);
    activeMsgIndex = Math.max(0, activeMsgIndex - 1);
    populateMsgList();
    refreshMsgForm();
  });
}

// --------------------------------------------------------
// LOCATIONS HUB
// --------------------------------------------------------
function populateLocList() {
  buildListDOM('custom-loc-list', runtimeLocations, activeLocIndex, 'customLocations', (idx) => {
    activeLocIndex = idx;
    populateLocList();
    refreshLocForm();
  }, () => {
    populateLocList();
    refreshLocForm();
  });
}

function refreshLocForm() {
  const container = document.getElementById('modal-loc-editor-fields');
  if (!container) return;
  if (runtimeLocations.length === 0) {
    container.innerHTML = `<div style="font-size:12px; color:#9ca3af; text-align:center; padding:20px;">No locations found.</div>`;
    return;
  }
  container.innerHTML = `
    <div style="margin-bottom: 12px;">
      <label>Location Label Name</label>
      <input type="text" id="l-field-lbl" value="${runtimeLocations[activeLocIndex].label || ''}">
    </div>
    <div style="margin-bottom: 14px;">
      <label>Macro Replacement Value (Press Ctrl + B to bold)</label>
      <div id="l-field-cnt" class="rich-editor rich-editor-single" contenteditable="true" data-placeholder="e.g. 🍑 ATL AVOS- "></div>
    </div>
    <button type="button" id="modal-loc-delete-btn" style="background-color:#ef4444; color:white; border:none; padding:8px 14px; border-radius:6px; cursor:pointer;">🗑️ Delete Location</button>
  `;

  document.getElementById('l-field-lbl').addEventListener('input', (e) => {
    const newName = e.target.value.trim();
    runtimeLocations[activeLocIndex].label = newName;
    const activeRow = document.querySelector('#custom-loc-list .selected-active');
    if (activeRow) activeRow.textContent = newName || `[Blank Entry #${activeLocIndex + 1}]`;
  });

  const locEditor = document.getElementById('l-field-cnt');
  locEditor.innerHTML = runtimeLocations[activeLocIndex].content || '';
  setupRichEditor(locEditor, (updatedHtml) => {
    runtimeLocations[activeLocIndex].content = updatedHtml;
  }, true);

  document.getElementById('modal-loc-delete-btn').addEventListener('click', () => {
    runtimeLocations.splice(activeLocIndex, 1);
    activeLocIndex = Math.max(0, activeLocIndex - 1);
    populateLocList();
    refreshLocForm();
  });
}

// ==========================================================================
// OPTIMIZED BACKUP & RESTORE PROCESSORS (settings.js)
// ==========================================================================
function triggerJSONDataExport() {
  const payload = {
    categories: runtimeCategories,
    messages: runtimeCollection,
    locations: runtimeLocations
  };

  const dataBlob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const downloadLink = document.createElement('a');

  downloadLink.href = URL.createObjectURL(dataBlob);
  downloadLink.download = 'message_manager_comprehensive_backup.json';
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
}

function processJSONDataUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const parsedData = JSON.parse(e.target.result);

      if (parsedData && Array.isArray(parsedData.messages) && Array.isArray(parsedData.categories)) {
        runtimeCategories = parsedData.categories;
        runtimeCollection = parsedData.messages;

        if (Array.isArray(parsedData.locations)) {
          runtimeLocations = parsedData.locations;
        }

        localStorage.setItem('customCategories', JSON.stringify(runtimeCategories));
        localStorage.setItem('customMessages', JSON.stringify(runtimeCollection));
        localStorage.setItem('customLocations', JSON.stringify(runtimeLocations));

        activeCatIndex = 0;
        activeMsgIndex = 0;
        activeLocIndex = 0;

        populateCatList();
        populateMsgList();
        populateLocList();
        refreshMsgForm();

        alert('📦 System database package updated and parsed successfully!');
      } else {
        alert('Invalid schema profile structure. Make sure your file contains both "categories" and "messages" arrays.');
      }
    } catch (err) {
      console.error('Import processor exception encountered:', err);
      alert('Failed to process text tracking file format. Check syntax formatting and retry.');
    }
  };
  reader.readAsText(file);
}

// --------------------------------------------------------
// PROCESSORS & LIFECYCLE
// --------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  const hardcodedDefaults = [
    { id: "cat-onr", label: "ONR" },
    { id: "cat-mc", label: "Mission Control Alerts" },
    { id: "cat-gc", label: "Ground Control" },
    { id: "cat-misc", label: "Miscellaneous" }
  ];

  const storedCats = localStorage.getItem('customCategories');
  runtimeCategories = storedCats ? JSON.parse(storedCats) : [...hardcodedDefaults];
  if (runtimeCategories.length === 0) runtimeCategories = [...hardcodedDefaults];

  runtimeCollection = localStorage.getItem('customMessages') ? JSON.parse(localStorage.getItem('customMessages')) : [...messages];
  runtimeLocations = localStorage.getItem('customLocations') ? JSON.parse(localStorage.getItem('customLocations')) : [...locations];

  const tabs = {
    cats: { btn: document.getElementById('tab-btn-cats'), panel: document.getElementById('settings-panel-cats'), form: 'modal-cat-editor-fields', init: () => { populateCatList(); refreshCatForm(); } },
    msgs: { btn: document.getElementById('tab-btn-msgs'), panel: document.getElementById('settings-panel-msgs'), form: 'modal-editor-fields', init: () => { populateMsgList(); refreshMsgForm(); } },
    locs: { btn: document.getElementById('tab-btn-locs'), panel: document.getElementById('settings-panel-locs'), form: 'modal-loc-editor-fields', init: () => { populateLocList(); refreshLocForm(); } }
  };

  Object.keys(tabs).forEach(key => {
    const current = tabs[key];
    if (!current.btn) return;
    current.btn.addEventListener('click', () => {
      Object.keys(tabs).forEach(k => {
        tabs[k].btn.style.background = 'transparent'; tabs[k].btn.style.color = '#9ca3af';
        tabs[k].panel.style.display = 'none';
        const form = document.getElementById(tabs[k].form);
        if (form) form.style.display = 'none';
      });
      current.btn.style.background = '#4f46e5'; current.btn.style.color = 'white';
      current.panel.style.display = 'flex';
      const formActive = document.getElementById(current.form);
      if (formActive) formActive.style.display = 'block';
      current.init();
    });
  });

  const picker = document.getElementById('hidden-file-picker');
  const exportBtn = document.getElementById('export-json-btn');
  const importBtn = document.getElementById('import-json-btn');

  if (exportBtn) exportBtn.addEventListener('click', triggerJSONDataExport);
  if (importBtn && picker) {
    importBtn.addEventListener('click', () => picker.click());
    picker.addEventListener('change', processJSONDataUpload);
  }

  document.getElementById('modal-cat-create-btn').addEventListener('click', () => {
    runtimeCategories.push({ id: 'cat-' + Date.now(), label: 'New Category' });
    activeCatIndex = runtimeCategories.length - 1;
    populateCatList(); refreshCatForm();
  });

  document.getElementById('modal-create-btn').addEventListener('click', () => {
    runtimeCollection.push({
      label: 'New Template',
      category: 'cat-mc',
      misc: '0',
      geo_on: '0',
      content: '',
      hkMod: 'none',
      hkKey: ''
    });
    activeMsgIndex = runtimeCollection.length - 1;
    populateMsgList(); refreshMsgForm();
  });

  document.getElementById('modal-loc-create-btn').addEventListener('click', () => {
    runtimeLocations.push({ label: 'New Location', content: '' });
    activeLocIndex = runtimeLocations.length - 1;
    populateLocList(); refreshLocForm();
  });

  document.getElementById('modal-save-btn').addEventListener('click', () => {
    localStorage.setItem('customCategories', JSON.stringify(runtimeCategories));
    localStorage.setItem('customMessages', JSON.stringify(runtimeCollection));
    localStorage.setItem('customLocations', JSON.stringify(runtimeLocations));
    window.close();
  });

  document.getElementById('modal-cancel-btn').addEventListener('click', () => window.close());

  populateMsgList(); refreshMsgForm();
});

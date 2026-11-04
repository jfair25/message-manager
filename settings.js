import { locations, messages } from './master.js';

let runtimeCollection = [];
let runtimeLocations = [];
let activeMsgIndex = 0;
let activeLocIndex = 0;

const msgSelector = document.getElementById('modal-msg-selector');
const locSelector = document.getElementById('modal-loc-selector');
const panelMsgs = document.getElementById('settings-panel-msgs');
const panelLocs = document.getElementById('settings-panel-locs');
const tabBtnMsgs = document.getElementById('tab-btn-msgs');
const tabBtnLocs = document.getElementById('tab-btn-locs');

const exportBtn = document.getElementById('export-json-btn');
const importBtn = document.getElementById('import-json-btn');
const filePicker = document.getElementById('hidden-file-picker');

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

function populateLocDropdown(targetIdx) {
  locSelector.innerHTML = '';
  runtimeLocations.forEach((loc, idx) => {
    const opt = document.createElement('option');
    opt.value = idx;
    opt.textContent = loc.label || `[Blank Location Row #${idx + 1}]`;
    opt.draggable = true;
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
      <button type="button" id="m-toggle-geo" data-state="${item.geo_on == '1' ? '1' : '0'}" style="width:100%; height:34px; font-size:12px; border-radius:6px; font-weight:700; text-align:center; transition:all 0.15s;"></button>
    </div>
    <div style="margin-bottom: 14px;">
      <label style="display:block; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.04em; margin-bottom:6px; color:#9ca3af;">Conditional Input Fields</label>
      <select id="m-field-misc" style="width:100%; padding:8px 12px; font-size:13px; border:1px solid #374151; border-radius:6px; background-color:#282d3a; color:#fff; outline:none;">
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
    <button type="button" id="modal-delete-btn" style="background-color:#ef4444; border:none; color:white; font-size:12px; font-weight:600; padding:0 12px; border-radius:6px; width:auto; height:32px; margin-top:4px;">🗑️ Delete Message</button>
  `;

  // Attach live handlers to instantly update the array when typing or selecting options
  ['m-field-lbl', 'm-field-misc', 'm-field-cnt'].forEach(id => {
    document.getElementById(id).addEventListener('input', stashActiveMsgChanges);
    if(id === 'm-field-misc') {
        document.getElementById(id).addEventListener('change', stashActiveMsgChanges);
    }
  });

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
    stashActiveMsgChanges();
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
    <button type="button" id="modal-loc-delete-btn" style="background-color:#ef4444; border:none; color:white; font-size:12px; font-weight:600; padding:0 12px; border-radius:6px; width:auto; height:32px; margin-top:4px;">🗑️ Delete Location</button>
  `;

  ['l-field-lbl', 'l-field-cnt'].forEach(id => {
    document.getElementById(id).addEventListener('input', stashActiveLocChanges);
  });

  document.getElementById('modal-loc-delete-btn').addEventListener('click', () => {
    runtimeLocations.splice(activeLocIndex, 1);
    populateLocDropdown(Math.max(0, activeLocIndex - 1));
    refreshLocForm();
  });
}

function triggerJSONDataExport() {
  stashActiveMsgChanges();
  stashActiveLocChanges();
  
  const payload = {
    messages: runtimeCollection,
    locations: runtimeLocations
  };
  
  const dataBlob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const downloadLink = document.createElement('a');
  
  downloadLink.href = URL.createObjectURL(dataBlob);
  downloadLink.download = 'message_manager_backup.json';
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
}

function processJSONDataUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const parsedData = JSON.parse(e.target.result);
      
      if (parsedData && Array.isArray(parsedData.messages)) {
        runtimeCollection = parsedData.messages;
        if (Array.isArray(parsedData.locations)) {
          runtimeLocations = parsedData.locations;
        }
        
        localStorage.setItem('customMessages', JSON.stringify(runtimeCollection));
        localStorage.setItem('customLocations', JSON.stringify(runtimeLocations));
        
        populateMsgDropdown(0);
        refreshMsgForm();
        populateLocDropdown(0);
        refreshLocForm();
        
        alert('📦 Configuration package uploaded and verified successfully!');
      } else {
        alert('Invalid data structure. Make sure your file contains an array named "messages".');
      }
    } catch(err) {
      console.error(err);
      alert('Failed to parse file tracking data. Check syntax formatting and retry.');
    }
  };
  reader.readAsText(file);
}

document.addEventListener('DOMContentLoaded', () => {
  const stored = localStorage.getItem('customMessages');
  runtimeCollection = stored ? JSON.parse(stored) : [...messages];

  const storedLocs = localStorage.getItem('customLocations');
  runtimeLocations = storedLocs ? JSON.parse(storedLocs) : [...locations];

  exportBtn.addEventListener('click', triggerJSONDataExport);
  importBtn.addEventListener('click', () => filePicker.click());
  filePicker.addEventListener('change', processJSONDataUpload);

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
    populateMsgDropdown(runtimeCollection.length - 1); 
    refreshMsgForm();
  });

  document.getElementById('modal-loc-create-btn').addEventListener('click', () => {
    stashActiveLocChanges();
    runtimeLocations.push({ label: "New City " + (runtimeLocations.length + 1), className: "NEW_LOC", content: "<b>NEW AVOS</b>- " });
    populateLocDropdown(runtimeLocations.length - 1); 
    refreshLocForm();
  });

  msgSelector.addEventListener('change', () => { stashActiveMsgChanges(); refreshMsgForm(); });
  locSelector.addEventListener('change', () => { stashActiveLocChanges(); refreshLocForm(); });

  populateMsgDropdown(0); refreshMsgForm();
  populateLocDropdown(0); refreshLocForm();

  document.getElementById('modal-save-btn').addEventListener('click', () => {
    stashActiveMsgChanges();
    stashActiveLocChanges();

    localStorage.setItem('customMessages', JSON.stringify(runtimeCollection));
    localStorage.setItem('customLocations', JSON.stringify(runtimeLocations));
    window.close();
  });

  document.getElementById('modal-cancel-btn').addEventListener('click', () => window.close());
});

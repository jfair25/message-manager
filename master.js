// Hardcoded Core Categories Layout Fallback
const defaultCategories = [
  { id: "cat-onr", label: "ONR" },
  { id: "cat-mc", label: "Mission Control Alerts" },
  { id: "cat-gc", label: "Ground Control" }
];

export let categories = (() => {
  const savedCats = localStorage.getItem('customCategories');
  return savedCats ? JSON.parse(savedCats) : defaultCategories;
})();

// RESTORED: Original complete locations macro list matching your initial database
// Hardcoded Default Locations Array Fallback
const defaultLocations = [
  { label: "Atlanta", className: "ATL", content: "🍑<b>ATL AVOS</b>- " },
  { label: "Austin", className: "AUS", content: "🪗<b>AUS AVOS</b>- " },
  { label: "Castle", className: "CAS", content: "🏯<b>CAS AVOS</b>- " },
  { label: "Chicago", className: "CHI", content: "🌬️<b>CHI AVOS</b>- " },
  { label: "Dallas", className: "DAL", content: "🤠<b>DAL AVOS</b>- " },
  { label: "Detroit", className: "DET", content: "🦁<b>DET AVOS</b>- " },
  { label: "Houston", className: "HOU", content: "🤘🏽<b>HOU AVOS</b>- " },
  { label: "Calvacade", className: "IAH", content: "🪗<b>IAH AVOS</b>- " },
  { label: "Los Angeles", className: "LAX", content: "🎥<b>LAX AVOS</b>- " },
  { label: "Las Vegas", className: "LAS", content: "🎰<b>LAS AVOS</b>- " },
  { label: "London", className: "LDN", content: "💂<b>LDN AVOS</b>- " },
  { label: "Minneapolis", className: "MSP", content: "🥶<b>MSP AVOS</b>- " },
  { label: "Mountain View", className: "MTV", content: "🗻<b>MTV AVOS</b>- " },
  { label: "Nashville", className: "NASH", content: "🎶<b>NASH AVOS</b>- " },
  { label: "New Orleans", className: "NOLA", content: "⚜️<b>NOLA AVOS</b>- " },
  { label: "Phoenix", className: "PHX", content: "🌞<b>PHX AVOS</b>- " },
  { label: "Portland", className: "PDX", content: "🌹<b>PDX AVOS</b>- " },
  { label: "Sacramento", className: "SAC", content: "👑<b>SAC AVOS</b>- " },
  { label: "San Antonio", className: "SAT", content: "🐂<b>SAT AVOS</b>- " },
  { label: "San Francisco", className: "SFO", content: "🌉<b>SFO AVOS</b>- " },
  { label: "Seattle", className: "SEA", content: "🌧️<b>SEA AVOS</b>- " },
  { label: "St. Louis", className: "STL", content: "🙃<b>STL AVOS</b>- " }
];

export let locations = (() => {
  const savedLocs = localStorage.getItem('customLocations');
  return savedLocs ? JSON.parse(savedLocs) : defaultLocations;
})();

// Hardcoded Default Messages with Categorized Mappings (Strict Single-Line Entry Arrays)
export const messages = [
  { "label": "Ground Checks In Field", "className": "GroundField", "misc": "1", "geo_on": "0", "content": "🚨<b>CCOS Request</b>- Car#{car} headed to depot. Please keep an eye out. Review, action and resolve NRRs/Vehicle Needs. Do not relaunch vehicle without resolving NRRs/Vehicle Needs.", "hkMod": "ctrl", "hkKey": "2", "category": "cat-gc" },
  { "label": "Ground Checks In Depot", "className": "GroundDepot", "misc": "1", "geo_on": "0", "content": "🚨<b>CCOS Request</b>- Car#{car} review, action and resolve NRRs/Vehicle Needs. Do not relaunch vehicle without resolving NRRs/Vehicle Needs.", "hkMod": "none", "hkKey": "", "category": "cat-gc" },
  { "label": "Route to Tech", "className": "Custom", "misc": "1", "geo_on": "1", "content": "{geo}🚨 Tech Requested Vehicle routed\\ncar#{car}\\nETA - (#) miles - Notes", "category": "cat-gc", "hkMod": "none", "hkKey": "" },
  { "label": "Unable to Route to Tech", "className": "RouteTech", "misc": "1", "geo_on": "0", "content": "🚨<b>CCOS Request</b>- The following vehicles car#{car} require Transport or Tow per tech request; please review and action as soon as possible (See in thread for more info):", "category": "cat-gc", "hkMod": "none", "hkKey": "" },
  { "label": "Parked in Production", "className": "Parked", "misc": "3", "geo_on": "1", "content": "{geo}<b>Parked in Production</b>- car#{car}, {ldap}, {today}. Please reach out to driver to update mission.", "hkMod": "ctrl", "hkKey": "3", "category": "cat-mc" },
  { "label": "Modem Down", "className": "Modem", "misc": "1", "geo_on": "1", "content": "{geo}<b>Modem_Down</b> for car#{car}. Please have fds perform a deep pc, once the vehicle returns to the depot. Vehicle appears to be in route to depot", "hkMod": "ctrl", "hkKey": "4", "category": "cat-mc" },
  { "label": "Very Long Break", "className": "LongBreak", "misc": "3", "geo_on": "1", "content": "{geo}<b>Very Long Break</b> car#{car}, {ldap}, {today}. Please reach out to driver to update mission.", "category": "cat-mc", "hkMod": "none", "hkKey": "" },
  { "label": "Hand Placement", "className": "HandPlacement", "misc": "3", "geo_on": "1", "content": "{geo}<b>Hand Placement Violation</b>- car#{car}, {ldap}, {today}. Driver has been flagged for a TP Hand Placement Violation. Please review the following footage and follow up as necessary.", "category": "cat-mc", "hkMod": "none", "hkKey": "" },
  { "label": "Charge Too High", "className": "High", "misc": "2", "geo_on": "1", "content": "{geo}<b>Charge Too High</b> for car#{car}. Charge: {charge}%. Please unplug ASAP.", "category": "cat-mc", "hkMod": "none", "hkKey": "" },
  { "label": "Charge Too Low", "className": "Low", "misc": "2", "geo_on": "1", "content": "{geo}🚨<b>Extremely Low Energy</b> for car#{car} 🚨{charge}%", "category": "cat-mc", "hkMod": "none", "hkKey": "" },
  { "label": "Mobile Device Policy Violation", "className": "DeviceViolation", "misc": "3", "geo_on": "1", "content": "{geo}<b>Mobile Device Policy Violation</b>- car#{car}, {ldap}, {today}. Driver has been flagged for a TP Mobile Device Policy Violation. Please review the following footage and follow up as necessary.", "category": "cat-mc", "hkMod": "none", "hkKey": "" },
  { "label": "Double ONR", "className": "ONR ONR", "misc": "0", "geo_on": "0", "content": "ONR ONR - Two IMPAIRED Alert Meter test scores within the last 60 minutes and should be removed from driving missions (Double ONR). Please ensure the driver waits 1 hour before retaking the Alert Meter test They are not cleared to operate a vehicle (including any driving for FDS/SC) until they retake and get an OK or Guarded.", "hkMod": "ctrl", "hkKey": "6", "category": "cat-onr" },
  { "label": "Double ONR Driver Ping", "className": "Custom", "misc": "0", "geo_on": "0", "content": "Hi, you have received two impaired results for your Alert Meter. Please retake your Alert Meter 1 hr after your second impaired test. \\n\\nYou are not cleared to operate a vehicle (including any driving for FDS/SC) until you receive an OK or guarded result on your Alert Meter 1 hour after your last impaired score.", "category": "cat-onr", "hkMod": "none", "hkKey": "" },
  { "label": "Still at Shift Start Location", "className": "ShiftStart", "misc": "3", "geo_on": "1", "content": "{geo}<b>Vehicle Still at Shift Start Location</b> for car#{car}, {ldap}, {today}. Can we please follow up with the driver at the moment they dont appear to be logging a mission.", "category": "cat-mc", "hkMod": "none", "hkKey": "" },
  { "label": "Fatigue Removal", "className": "Fatigue", "misc": "3", "geo_on": "1", "content": "{geo}<b>Fatigue Removal Determined</b>- car#{car}, {ldap}, {today}. CAFE has recommended a Fatigue Removal is necessary. Please review the following footage and coordinate a rescue.", "category": "cat-mc", "hkMod": "none", "hkKey": "" },
  { "label": "Single ONR", "className": "Custom", "misc": "0", "geo_on": "0", "content": "Single ONR. Please have EE retest ASAP.", "category": "cat-onr", "hkMod": "none", "hkKey": "" },
  { "label": "Single ONR Driver Ping", "className": "Custom", "misc": "0", "geo_on": "0", "content": "Hello. Please retake your Alert Meter ASAP.", "category": "cat-onr", "hkMod": "none", "hkKey": "" },
  { "label": "Dual Driver Double ONR", "className": "Custom", "misc": "0", "geo_on": "0", "content": "ONR ONR - Two IMPAIRED Alert Meter test scores within the last 60 minutes and should be removed from driving missions (Double ONR). Please ensure the driver waits 15 minutes before retaking the Alert Meter test. They are not cleared to operate a vehicle (including any driving for FDS/SC) until they retake and get an OK or Guarded.", "category": "cat-onr", "hkMod": "none", "hkKey": "" },
  { "label": "Dual Driver Double ONR Driver Ping", "className": "Custom", "misc": "0", "geo_on": "0", "content": "Hi, you have received two impaired results for your Alert Meter. Please retake your Alert Meter 15 min after your second impaired test. \\n\\nYou are not cleared to operate a vehicle (including any driving for FDS/SC) until you receive an OK or Guarded result on your Alert Meter 15 minutes after your last impaired score.", "category": "cat-onr", "hkMod": "none", "hkKey": "" },
  { "label": "Outside Normal Range", "className": "OutsideRange", "misc": "0", "geo_on": "1", "content": "{geo}<b>Outside Normal Range (ONR)</b>-", "hkMod": "ctrl", "hkKey": "5", "category": "cat-onr" }
];

export function retreiveGlobalMsg() {
  const today = new Date().toLocaleDateString();
  const ldap = localStorage.getItem("globalLdap") || "no driver";
  const car = localStorage.getItem("globalCar") || "N/A";
  const charge = localStorage.getItem("globalCharge") || "0";
  const label = localStorage.getItem("globalLabel");
  const geo = localStorage.getItem("globalGeo") || "";

  const savedData = localStorage.getItem('customMessages');
  const activeMessages = savedData ? JSON.parse(savedData) : messages;
  const matchedMessage = activeMessages.find(m => m.label === label);

  let isolatedMsg = "";
  if (matchedMessage && matchedMessage.content) {
    isolatedMsg = matchedMessage.content
      .replace(/{geo}/g, geo)
      .replace(/{car}/g, car)
      .replace(/{ldap}/g, ldap)
      .replace(/{charge}/g, charge)
      .replace(/{today}/g, today);
  }
  localStorage.setItem("globalMsg", `${isolatedMsg}`);
}

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

// Hardcoded Default Messages Array Fallback
export const messages = [
  { label: "Parked in Production", className: "Parked", misc:"3", geo_on: "1", content: "{geo}<b>Parked in Production</b>- car#{car}, {ldap}, {today}. Please reach out to driver to update mission." },
  { label: "Modem Down", className: "Modem", misc:"1", geo_on: "1", content: "{geo}<b>Modem_Down</b> for car#{car}. Please have fds perform a deep pc, once the vehicle returns to the depot. Vehicle appears to be in route to depot" },
  { label: "Charge Too High", className: "High", misc:"2", geo_on: "1", content: "{geo}<b>Charge Too High</b> for car#{car}. Charge: {charge}%. Please unplug ASAP." },
  { label: "Charge Too Low", className: "Low", misc:"2", geo_on: "1", content: "{geo}🚨<b>Extremely Low Energy</b> for car#{car} 🚨{charge}%" },
  { label: "Fatigue Removal", className: "Fatigue", misc:"3", geo_on: "1", content: "{geo}<b>Fatigue Removal Determined</b>- car#{car}, {ldap}, {today}. CAFE has recommended a Fatigue Removal is necessary. Please review the following footage and coordinate a rescue." },
  { label: "Still at Shift Start Location", className: "ShiftStart", misc:"3", geo_on: "1", content: "{geo}<b>Vehicle Still at Shift Start Location</b> for car#{car}, {ldap}, {today}. Can we please follow up with the driver at the moment they dont appear to be logging a mission." },
  { label: "Very Long Break", className: "LongBreak", misc:"3", geo_on: "1", content: "{geo}<b>Very Long Break</b> car#{car}, {ldap}, {today}. Please reach out to driver to update mission." },
  { label: "Route to Tech", className: "RouteTech", misc:"1", geo_on: "0", content: "car#{car} requested a route to tech🔧, but unrouteable by CC - please acknowledge and action." },
  { label: "Outside Normal Range", className: "OutsideRange", misc:"0", geo_on: "1", content: "{geo}<b>Outside Normal Range (ONR)</b>- " },
  { label: "Ground Checks In Field", className: "GroundField", misc:"1", geo_on: "0", content: "🚨<b>CCOS Request</b>- Car#{car} headed to depot. Please keep an eye out. Review, action and resolve NRRs/Vehicle Needs. Do not relaunch vehicle without resolving NRRs/Vehicle Needs." },
  { label: "Ground Checks In Depot", className: "GroundDepot", misc:"1", geo_on: "0", content: "🚨<b>CCOS Request</b>- Car#{car} review, action and resolve NRRs/Vehicle Needs. Do not relaunch vehicle without resolving NRRs/Vehicle Needs." },
  { label: "Hand Placement", className: "HandPlacement", misc:"3", geo_on: "1", content: "{geo}<b>Hand Placement Violation</b>- car#{car}, {ldap}, {today}. Driver has been flagged for a TP Hand Placement Violation. Please review the following footage and follow up as necessary." },
  { label: "Mobile Device Policy Violation", className: "DeviceViolation", misc:"3", geo_on: "1", content: "{geo}<b>Mobile Device Policy Violation</b>- car#{car}, {ldap}, {today}. Driver has been flagged for a TP Mobile Device Policy Violation. Please review the following footage and follow up as necessary." },
  { label: "Double ONR", className: "ONR ONR", misc:"0", geo_on: "0", content: "ONR ONR - Two IMPAIRED Alert Meter test scores within the last 60 minutes and should be removed from driving missions (Double ONR). Please ensure the driver waits 1 hour before retaking the Alert Meter test They are not cleared to operate a vehicle (including any driving for FDS/SC) until they retake and get an OK or Guarded." }
];

export let locations = (() => {
  const savedLocs = localStorage.getItem('customLocations');
  return savedLocs ? JSON.parse(savedLocs) : defaultLocations;
})();

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

document.addEventListener("DOMContentLoaded", () => {
  // --- DITO KA MAG-UUPDATE NG VERSION ---
  // Palitan mo lang ang numero ng 'minorVersion' kapag gusto mo ng bagong timestamp.
  const majorVersion = 1;
  const minorVersion = 6; // Itinakda sa 1 para mag-trigger ng update sa unang run

  // Ang iyong bago at live na Google Apps Script Web App URL
  const GAS_URL =
    "https://script.google.com/macros/s/AKfycbxkQxmiwNJqh96y8X9mE47-IYPWsHrmgwTgV9F4UAR4gQUShUsKXdFkFeHTr7caWRW1/exec";

  // Idudugtong natin ang version sa URL para malaman ng backend kung kailangan mag-update.
  const fullUrl = `${GAS_URL}?major=${majorVersion}&minor=${minorVersion}`;

  const versionElement = document.getElementById("version-display");

  fetch(fullUrl)
    .then((response) => {
      if (!response.ok) {
        throw new Error(
          `Network response was not ok. Status: ${response.status}`
        );
      }
      return response.json();
    })
    .then((data) => {
      if (data.error) {
        throw new Error(`API Error: ${data.error}`);
      }

      const { major, minor, timestamp, fixDate } = data;

      // Check kung undefined ang data dahil sa maling pagbasa sa sheet
      if (typeof major === "undefined" || typeof minor === "undefined") {
        throw new Error(
          "Received incomplete data from API. Check Google Sheet."
        );
      }

      const fullVersionString = `Version ${major}.${minor}.${timestamp}.${fixDate}`;

      if (versionElement) {
        versionElement.textContent = fullVersionString;
      }
    })
    .catch((error) => {
      // Magpapakita ito ng error kung hindi ma-contact ang API
      console.error("Error fetching or processing version:", error);
      if (versionElement) {
        versionElement.textContent = "Error loading version. Check console.";
      }
    });
});

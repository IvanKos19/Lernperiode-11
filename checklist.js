// Geräte‑Check App – Grundlogik
// Datenmodell für die Checkliste
const CHECK_ITEMS = [
  { id: "boot", title: "Gerät startet und erreicht Desktop", required: true },
  { id: "battery", title: "Akku lädt und hält Ladung", required: false },
  { id: "keyboard", title: "Tastatur funktioniert", required: true },
  { id: "touchpad", title: "Touchpad/Mouse funktioniert", required: true },
  { id: "screen", title: "Display ohne starke Pixelfehler/Brüche", required: true },
  { id: "wifi", title: "WLAN verbindet stabil", required: true },
  { id: "ports", title: "USB/Netzteil-Port ohne Wackelkontakt", required: false },
  { id: "storage", title: "Speicher/SSD wird erkannt", required: true },
  { id: "os", title: "Betriebssystem installiert (z. B. Linux), Updates möglich", required: false },
];

const $ = (sel) => document.querySelector(sel);

function todayISO() {
  const d = new Date();
  const tz = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return tz.toISOString().slice(0, 10);
}

function renderChecklist(container) {
  container.innerHTML = "";
  CHECK_ITEMS.forEach((item) => {
    const div = document.createElement("div");
    div.className = "item";
    div.dataset.itemId = item.id;
    div.innerHTML = `
      <div class="item-header">
        <span class="item-title">${item.title}${item.required ? " *" : ""}</span>
        <div class="item-controls">
          <select aria-label="Ergebnis">
            <option value="">— Auswahl —</option>
            <option value="ja">Ja</option>
            <option value="nein">Nein</option>
            <option value="n/a">Nicht geprüft</option>
          </select>
        </div>
      </div>
      <div class="item-notes">
        <textarea placeholder="Bemerkung (optional)"></textarea>
      </div>
    `;
    container.appendChild(div);
  });
}

function collectData() {
  const meta = {
    deviceId: $("#deviceId").value.trim(),
    testerName: $("#testerName").value.trim(),
    checkDate: $("#checkDate").value || todayISO(),
  };

  const results = [];
  document.querySelectorAll(".item").forEach((el) => {
    const id = el.dataset.itemId;
    const title = el.querySelector(".item-title").textContent;
    const select = el.querySelector("select").value;
    const notes = el.querySelector("textarea").value.trim();
    results.push({ id, title, result: select, notes });
  });

  return { meta, results, timestamp: new Date().toISOString() };
}

function validateRequired(data) {
  // simple validation: required items must be answered ja/nein
  const missing = [];
  CHECK_ITEMS.forEach((it) => {
    if (!it.required) return;
    const r = data.results.find((x) => x.id === it.id);
    if (!r || !["ja", "nein"].includes(r.result)) missing.push(it.title);
  });
  return missing;
}

function saveLocal(data) {
  const key = `geraete-check:${data.meta.deviceId || "unbekannt"}:${data.meta.checkDate}`;
  localStorage.setItem(key, JSON.stringify(data));
  return key;
}

function showSummary(data, key) {
  const pre = $("#summaryPre");
  const out = {
    storageKey: key,
    ...data,
  };
  pre.textContent = JSON.stringify(out, null, 2);
  $("#summary").classList.remove("hidden");
}

function exportJSON(data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const did = data.meta.deviceId || "unbekannt";
  a.href = url;
  a.download = `geraete-check-${did}-${data.meta.checkDate}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function resetAll() {
  $("#meta-form").reset();
  $("#checkDate").value = todayISO();
  renderChecklist($("#checklist"));
  $("#summary").classList.add("hidden");
  $("#summaryPre").textContent = "";
}

function init() {
  // set default date
  $("#checkDate").value = todayISO();
  // render list
  renderChecklist($("#checklist"));

  $("#saveBtn").addEventListener("click", () => {
    const data = collectData();
    const missing = validateRequired(data);
    if (missing.length) {
      alert("Bitte prüfe folgende Pflichtpunkte:
• " + missing.join("\n• "));
      return;
    }
    const key = saveLocal(data);
    showSummary(data, key);
  });

  $("#exportBtn").addEventListener("click", () => {
    const data = collectData();
    exportJSON(data);
    showSummary(data, "(kein lokaler Speicher – Export)");
  });

  $("#resetBtn").addEventListener("click", resetAll);
}

document.addEventListener("DOMContentLoaded", init);

// =============================================
// Sidebar & Navigation
// =============================================
const sidebar = document.getElementById("sidebar");

let hoverTimer = null;

sidebar.addEventListener("mouseenter", () => {
  clearTimeout(hoverTimer);
  sidebar.classList.remove("collapsed");
});

sidebar.addEventListener("mouseleave", () => {
  hoverTimer = setTimeout(() => {
    sidebar.classList.add("collapsed");
  }, 300);
});

document.querySelectorAll(".nav-item").forEach((item) => {
  item.addEventListener("click", () => {
    document.querySelectorAll(".nav-item").forEach((n) => n.classList.remove("active"));
    item.classList.add("active");
    document.querySelectorAll(".content-section").forEach((s) => s.classList.remove("active"));
    const section = document.getElementById("section-" + item.dataset.section);
    if (section) section.classList.add("active");
    clearTimeout(hoverTimer);
    sidebar.classList.add("collapsed");
  });
});

// =============================================
// Theme Toggle
// =============================================
const html = document.documentElement;
const themeToggle = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");
const themeLabel = document.getElementById("themeLabel");

function setTheme(theme) {
  html.setAttribute("data-theme", theme);
  localStorage.setItem("tj-theme", theme);
  themeIcon.textContent = theme === "dark" ? "☀️" : "🌙";
  themeLabel.textContent = theme === "dark" ? "Light Mode" : "Dark Mode";
}

const savedTheme = localStorage.getItem("tj-theme") || "light";
setTheme(savedTheme);

themeToggle.addEventListener("click", () => {
  const current = html.getAttribute("data-theme");
  setTheme(current === "dark" ? "light" : "dark");
});

// =============================================
// API & App Logic
// =============================================
const API_BASE = "/api/trades";

const form = document.getElementById("tradeForm");
const tbody = document.getElementById("tradeTableBody");
const loading = document.getElementById("loading");
const filterFrom = document.getElementById("filter_from");
const filterTo = document.getElementById("filter_to");

const entryPrice = document.getElementById("entry_price");
const exitPrice = document.getElementById("exit_price");
const quantity = document.getElementById("quantity");
const previewPLPerUnit = document.getElementById("preview_pl_per_unit");
const previewPLTotal = document.getElementById("preview_pl_total");
const previewReturns = document.getElementById("preview_returns");

const formSubmitBtn = document.getElementById("formSubmitBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");
let editingId = null;

function formatDate(dateStr) {
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const [y, m, d] = dateStr.split("-");
  return `${+d} ${months[+m - 1]} ${y}`;
}

function setDefaultDates() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const today = `${yyyy}-${mm}-${dd}`;
  document.getElementById("entry_date").value = today;
  document.getElementById("exit_date").value = today;
}

function getDirection() {
  const bs = document.getElementById("buy_sell").value;
  const ot = document.getElementById("option_type").value;
  if (!bs || !ot) return null;
  return (bs === "BUY" && ot === "CE") || (bs === "SELL" && ot === "PE") ? 1 : -1;
}

function updatePreview() {
  const ep = parseFloat(entryPrice.value);
  const xp = parseFloat(exitPrice.value);
  const qty = parseInt(quantity.value, 10);
  const dir = getDirection();

  if (isNaN(ep) || isNaN(xp) || isNaN(qty) || qty <= 0 || dir === null) {
    previewPLPerUnit.textContent = "--";
    previewPLTotal.textContent = "--";
    previewReturns.textContent = "--";
    return;
  }

  const plUnit = Math.round(dir * (xp - ep) * 100) / 100;
  const plTotal = Math.round(plUnit * qty * 100) / 100;
  const retPct = ep !== 0 ? Math.round((plUnit / ep) * 10000) / 100 : 0;

  previewPLPerUnit.textContent = plUnit.toFixed(2);
  previewPLTotal.textContent = plTotal.toFixed(2);
  previewReturns.textContent = retPct.toFixed(2) + "%";

  previewPLPerUnit.style.color = plUnit >= 0 ? "#16a34a" : "#dc2626";
  previewPLTotal.style.color = plTotal >= 0 ? "#16a34a" : "#dc2626";
  previewReturns.style.color = retPct >= 0 ? "#16a34a" : "#dc2626";
}

entryPrice.addEventListener("input", updatePreview);
exitPrice.addEventListener("input", updatePreview);
quantity.addEventListener("input", updatePreview);
document.getElementById("buy_sell").addEventListener("change", updatePreview);
document.getElementById("option_type").addEventListener("change", updatePreview);

function getTrades() {
  loading.style.display = "block";
  const params = new URLSearchParams();
  if (filterFrom.value) params.set("from_date", filterFrom.value);
  if (filterTo.value) params.set("to_date", filterTo.value);
  const url = params.toString() ? `${API_BASE}?${params}` : API_BASE;
  fetch(url)
    .then((res) => res.json())
    .then((trades) => {
      loading.style.display = "none";
      tbody.innerHTML = "";
      trades.forEach((t, i) => {
        const isPLPositive = t.profit_loss_total >= 0;
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${i + 1}</td>
          <td>${formatDate(t.entry_date)}</td>
          <td>${formatDate(t.exit_date)}</td>
          <td>${t.scrip_name}</td>
          <td>${t.option_type}</td>
          <td>${t.buy_sell}</td>
          <td>${t.entry_price.toFixed(2)}</td>
          <td>${t.exit_price.toFixed(2)}</td>
          <td class="${isPLPositive ? "pl-positive" : "pl-negative"}">${t.profit_loss_per_unit.toFixed(2)}</td>
          <td>${t.quantity}</td>
          <td class="${isPLPositive ? "pl-positive" : "pl-negative"}">${t.profit_loss_total.toFixed(2)}</td>
          <td class="${isPLPositive ? "pl-positive" : "pl-negative"}">${t.returns_percent.toFixed(2)}%</td>
          <td>${t.notes || "--"}</td>
          <td>
            <button class="edit-btn" data-id="${t.id}">Edit</button>
            <button class="delete-btn" data-id="${t.id}">Delete</button>
          </td>
        `;
        tbody.appendChild(row);
      });

      document.querySelectorAll(".delete-btn").forEach((btn) => {
        btn.addEventListener("click", () => deleteTrade(btn.dataset.id));
      });
      document.querySelectorAll(".edit-btn").forEach((btn) => {
        btn.addEventListener("click", () => editTrade(btn.dataset.id));
      });
    })
    .catch(() => {
      loading.textContent = "Failed to load trades. Is the backend running?";
    });
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const btn = form.querySelector("button[type='submit']");
  btn.disabled = true;

  const payload = {
    entry_date: document.getElementById("entry_date").value,
    exit_date: document.getElementById("exit_date").value,
    scrip_name: document.getElementById("scrip_name").value,
    option_type: document.getElementById("option_type").value,
    buy_sell: document.getElementById("buy_sell").value,
    entry_price: parseFloat(entryPrice.value),
    exit_price: parseFloat(exitPrice.value),
    quantity: parseInt(quantity.value, 10),
    notes: document.getElementById("notes").value || null,
  };

  const url = editingId ? `${API_BASE}/${editingId}` : API_BASE;
  const method = editingId ? "PUT" : "POST";

  fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
    .then((res) => {
      if (!res.ok) throw new Error("Failed to save");
      return res.json();
    })
    .then(() => {
      form.reset();
      setDefaultDates();
      updatePreview();
      getTrades();
      cancelEdit();
      showToast(editingId ? "Trade updated successfully!" : "Trade saved successfully!", "success");
    })
    .catch((err) => { alert("Error: " + err.message); showToast("Failed to save trade", "error"); })
    .finally(() => {
      btn.disabled = false;
    });
});

// ---- Toast Notifications ----
function showToast(message, type) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.className = type || "success";
  toast.classList.add("show");
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove("show"), 3000);
}

document.getElementById("toast").addEventListener("click", function () {
  this.classList.remove("show");
});

function deleteTrade(id) {
  if (!confirm("Delete this trade?")) return;
  fetch(`${API_BASE}/${id}`, { method: "DELETE" }).then(() => getTrades());
}

// ---- Edit Trade ----
function editTrade(id) {
  fetch(`${API_BASE}/${id}`)
    .then((r) => r.json())
    .then((t) => {
      document.getElementById("entry_date").value = t.entry_date;
      document.getElementById("exit_date").value = t.exit_date;
      document.getElementById("scrip_name").value = t.scrip_name;
      document.getElementById("buy_sell").value = t.buy_sell;
      document.getElementById("option_type").value = t.option_type;
      entryPrice.value = t.entry_price;
      exitPrice.value = t.exit_price;
      quantity.value = t.quantity;
      document.getElementById("notes").value = t.notes || "";
      editingId = t.id;
      formSubmitBtn.textContent = "Update Trade";
      cancelEditBtn.style.display = "inline-block";
      updatePreview();
      document.querySelector('.nav-item[data-section="entry"]').click();
    });
}

function cancelEdit() {
  editingId = null;
  form.reset();
  setDefaultDates();
  updatePreview();
  formSubmitBtn.textContent = "Save Trade";
  cancelEditBtn.style.display = "none";
}

cancelEditBtn.addEventListener("click", cancelEdit);

// ---- Reports ----
const reportContainer = document.getElementById("reportContainer");
const reportTitle = document.getElementById("reportTitle");
const reportBody = document.getElementById("reportTableBody");
const reportBtns = document.querySelectorAll(".report-btn");

function formatPeriod(period) {
  if (/^\d{4}-W\d{2}$/.test(period)) {
    const [year, week] = period.split("-W");
    return `Week ${week}, ${year}`;
  }
  if (/^\d{4}-\d{2}$/.test(period)) {
    const [y, m] = period.split("-");
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return `${months[parseInt(m,10)-1]} ${y}`;
  }
  return period;
}

function loadReport(type) {
  reportTitle.textContent = type === "weekly" ? "Weekly Report" : "Monthly Report";
  reportBody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:2rem;color:#888;">Loading...</td></tr>';

  reportBtns.forEach(b => b.classList.toggle("active", b.dataset.report === type));

  fetch(`/api/reports/${type}`)
    .then((r) => r.json())
    .then((rows) => {
      reportBody.innerHTML = "";
      if (rows.length === 0) {
        reportBody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:2rem;color:#888;">No trades found for this period.</td></tr>';
        return;
      }

      let totTrades = 0, totWins = 0, totLosses = 0, totPL = 0, totInvestment = 0, totQty = 0;

      rows.forEach((r) => {
        totTrades += r.total_trades;
        totWins += r.winning_trades;
        totLosses += r.losing_trades;
        totPL += r.total_pl;
        totQty += r.total_quantity;

        const winRate = r.total_trades > 0
          ? ((r.winning_trades / r.total_trades) * 100).toFixed(1) + "%"
          : "--";
        const isPLPositive = r.total_pl >= 0;
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td class="report-period">${formatPeriod(r.period)}</td>
          <td class="num">${r.total_trades}</td>
          <td class="num pl-positive">${r.winning_trades}</td>
          <td class="num pl-negative">${r.losing_trades}</td>
          <td class="num">${winRate}</td>
          <td class="num ${isPLPositive ? "pl-positive" : "pl-negative"}">${r.total_pl.toFixed(2)}</td>
          <td class="num ${isPLPositive ? "pl-positive" : "pl-negative"}">${r.period_return_pct != null ? r.period_return_pct.toFixed(2) + "%" : "--"}</td>
          <td class="num">${r.total_quantity}</td>
        `;
        reportBody.appendChild(tr);
      });

      const totWinRate = totTrades > 0 ? ((totWins / totTrades) * 100).toFixed(1) + "%" : "--";
      const totPLPositive = totPL >= 0;
      const trTotal = document.createElement("tr");
      trTotal.className = "totals-row";
      trTotal.innerHTML = `
        <td>TOTAL</td>
        <td class="num">${totTrades}</td>
        <td class="num pl-positive">${totWins}</td>
        <td class="num pl-negative">${totLosses}</td>
        <td class="num">${totWinRate}</td>
        <td class="num ${totPLPositive ? "pl-positive" : "pl-negative"}">${totPL.toFixed(2)}</td>
        <td class="num">--</td>
        <td class="num">${totQty}</td>
      `;
      reportBody.appendChild(trTotal);
    })
    .catch(() => {
      reportBody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:2rem;color:#888;">Failed to load report.</td></tr>';
    });
}

reportBtns.forEach((btn) => {
  btn.addEventListener("click", () => loadReport(btn.dataset.report));
});

// ---- PDF Export ----
function exportTableToPDF(selector, title, filename, colStyles) {
  if (typeof window.jspdf === "undefined" || typeof window.jspdf.jsPDF !== "function") {
    alert("PDF library failed to load. Check your internet connection and refresh.");
    return;
  }

  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

    const table = document.querySelector(selector);
    if (!table || table.querySelectorAll("tbody tr").length === 0) {
      alert("No data to export.");
      return;
    }

    const rows = [];
    const headers = [];

    table.querySelectorAll("thead th").forEach((th) => {
      headers.push(th.textContent.trim());
    });

    table.querySelectorAll("tbody tr").forEach((tr) => {
      const row = [];
      tr.querySelectorAll("td").forEach((td) => {
        row.push(td.textContent.trim());
      });
      if (row.length) rows.push(row);
    });

    doc.setFontSize(16);
    doc.text(title, 14, 20);
    doc.setFontSize(10);
    doc.text(new Date().toLocaleString("en-IN"), 14, 27);

    doc.autoTable({
      head: [headers],
      body: rows,
      startY: 32,
      theme: "grid",
      headStyles: { fillColor: [26, 26, 46], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [248, 249, 252] },
      styles: { fontSize: 8, cellPadding: 2.5 },
      columnStyles: colStyles || {},
      didParseCell(data) {
        const text = data.cell.raw || "";
        if (typeof text === "string" && text.startsWith("-")) {
          data.cell.styles.textColor = [220, 38, 38];
        }
      },
    });

    doc.save(filename);
  } catch (e) {
    alert("Failed to generate PDF: " + e.message);
    console.error(e);
  }
}

document.getElementById("exportReportPDF").addEventListener("click", () => {
  exportTableToPDF(
    "#reportTable",
    document.getElementById("reportTitle").textContent,
    `${document.getElementById("reportTitle").textContent.replace(/\s+/g, "_")}.pdf`,
    { 0: { cellWidth: 50 } }
  );
});

function toCsvValue(val) {
  const s = String(val);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

document.getElementById("exportTradesCSV").addEventListener("click", () => {
  const params = new URLSearchParams();
  if (filterFrom.value) params.set("from_date", filterFrom.value);
  if (filterTo.value) params.set("to_date", filterTo.value);
  const url = params.toString() ? `${API_BASE}?${params}` : API_BASE;

  fetch(url)
    .then((r) => r.json())
    .then((trades) => {
      const headers = ["#", "Entry Date", "Exit Date", "Scrip Name", "Type", "B/S",
        "Entry Price", "Exit Price", "P/L Per Unit", "Qty", "P/L Total", "% Returns", "Notes"];
      const rows = trades.map((t, i) => [
        i + 1, t.entry_date, t.exit_date, t.scrip_name, t.option_type, t.buy_sell,
        t.entry_price.toFixed(2), t.exit_price.toFixed(2),
        t.profit_loss_per_unit.toFixed(2), t.quantity,
        t.profit_loss_total.toFixed(2), t.returns_percent.toFixed(2), t.notes || ""
      ].map(toCsvValue));
      const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Trade_History_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    })
    .catch((err) => alert("Error exporting CSV: " + err.message));
});

// ---- Database Backup ----
function triggerBackup(btn) {
  btn.disabled = true;
  const originalText = btn.textContent;
  btn.textContent = "Backing up...";

  const filename = `trading_journal_backup_${new Date().toISOString().slice(0, 10)}.sql`;

  fetch("/api/backup")
    .then((r) => {
      if (!r.ok) throw new Error("Backup failed");
      return r.blob();
    })
    .then((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      const resultEl = document.getElementById("backupResult");
      const nameEl = document.getElementById("backupFilename");
      const tsEl = document.getElementById("backupTimestamp");
      if (nameEl && tsEl) {
        nameEl.textContent = filename;
        tsEl.textContent = "Downloaded at " + new Date().toLocaleString();
        resultEl.style.display = "block";
      }

      showToast("Database backup downloaded!", "success");
    })
    .catch((err) => { alert("Error: " + err.message); showToast("Backup failed", "error"); })
    .finally(() => {
      btn.disabled = false;
      btn.textContent = originalText;
    });
}

document.getElementById("backupSectionBtn").addEventListener("click", () => {
  triggerBackup(document.getElementById("backupSectionBtn"));
});

document.getElementById("backupDB").addEventListener("click", () => {
  triggerBackup(document.getElementById("backupDB"));
});

// ---- Restore Database ----
document.getElementById("restoreBtn").addEventListener("click", () => {
  const fileInput = document.getElementById("restoreFileInput");
  const file = fileInput.files[0];
  if (!file) { showToast("Please select a .sql backup file first", "error"); return; }
  if (!confirm("⚠️  Restore will REPLACE all current data with the backup. This cannot be undone. Continue?")) return;

  const btn = document.getElementById("restoreBtn");
  btn.disabled = true;
  btn.textContent = "Restoring...";

  const formData = new FormData();
  formData.append("file", file);

  fetch("/api/restore", { method: "POST", body: formData })
    .then((r) => {
      if (!r.ok) return r.json().then((e) => { throw new Error(e.detail || "Restore failed"); });
      return r.json();
    })
    .then(() => {
      showToast("Database restored successfully!", "success");
      document.getElementById("restoreResult").style.display = "none";
      fileInput.value = "";
      getTrades();
    })
    .catch((err) => {
      showToast("Restore failed: " + err.message, "error");
    })
    .finally(() => {
      btn.disabled = false;
      btn.textContent = "⚠️  Restore Database";
    });
});

// ---- Date Filter ----
document.getElementById("filterApply").addEventListener("click", getTrades);
document.getElementById("filterClear").addEventListener("click", () => {
  filterFrom.value = "";
  filterTo.value = "";
  getTrades();
});
filterFrom.addEventListener("keydown", (e) => { if (e.key === "Enter") getTrades(); });
filterTo.addEventListener("keydown", (e) => { if (e.key === "Enter") getTrades(); });

setDefaultDates();
getTrades();

let debounceTimer;
function debounce(func, delay = 300) { clearTimeout(debounceTimer); debounceTimer = setTimeout(func, delay); }

// ---------- Dashboard ----------
function updateDashboard() {
  const repairs = getRepairs();
  const total = repairs.length;
  const pending = repairs.filter(r => r.status === 'Pending').length;
  const inProgress = repairs.filter(r => r.status === 'In Progress').length;
  const ready = repairs.filter(r => r.status === 'Ready').length;
  const completed = countCompleted(repairs);
  const today = new Date().toISOString().slice(0,10);
  const todayRevenue = repairs.filter(r => r.status === 'Completed' && r.dateReceived === today).reduce((sum, r) => sum + (parseFloat(r.cost)||0), 0);
  const monthRevenue = repairs.filter(r => r.status === 'Completed' && r.dateReceived?.startsWith(today.slice(0,7))).reduce((sum, r) => sum + (parseFloat(r.cost)||0), 0);
  const pendingAmount = repairs.filter(r => r.status !== 'Completed').reduce((sum, r) => sum + calculateRemaining(r.cost||0, r.advance||0), 0);
  const readyForDelivery = repairs.filter(r => r.status === 'Ready').length;

  const shop = getShopSettings();
  const curr = shop.currency || '₹';

  document.getElementById('statsGrid').innerHTML = `
    <div class="stat-card"><i class="fas fa-tools"></i><div><h3>Total Repairs</h3><p>${total}</p></div></div>
    <div class="stat-card"><i class="fas fa-clock"></i><div><h3>Pending</h3><p>${pending}</p></div></div>
    <div class="stat-card"><i class="fas fa-spinner"></i><div><h3>In Progress</h3><p>${inProgress}</p></div></div>
    <div class="stat-card"><i class="fas fa-box"></i><div><h3>Ready for Delivery</h3><p>${readyForDelivery}</p></div></div>
    <div class="stat-card"><i class="fas fa-check-circle"></i><div><h3>Completed</h3><p>${completed}</p></div></div>
    <div class="stat-card"><i class="fas fa-calendar-day"></i><div><h3>Revenue Today</h3><p>${curr}${todayRevenue}</p></div></div>
    <div class="stat-card"><i class="fas fa-calendar-week"></i><div><h3>Revenue This Month</h3><p>${curr}${monthRevenue}</p></div></div>
    <div class="stat-card"><i class="fas fa-hand-holding-usd"></i><div><h3>Pending Amount</h3><p>${curr}${pendingAmount}</p></div></div>
  `;

  const recent = [...repairs].sort((a,b) => b.id.localeCompare(a.id)).slice(0,5);
  document.querySelector('#recentTable tbody').innerHTML = recent.map(r => `
    <tr><td>${r.custName}</td><td>${r.custModel || '-'}</td><td>${r.problemDesc}</td><td>${createStatusBadge(r.status)}</td><td>${curr}${r.cost}</td></tr>
  `).join('');
}

// ---------- Customer List ----------
function renderCustomerList() {
  let repairs = getRepairs();
  const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
  const filterStatus = document.getElementById('filterStatus')?.value || '';
  const sortBy = document.getElementById('sortBy')?.value || 'date';
  const shop = getShopSettings();
  const curr = shop.currency || '₹';

  if (searchTerm) repairs = searchCustomers(repairs, searchTerm);
  if (filterStatus) repairs = repairs.filter(r => r.status === filterStatus);

  switch(sortBy) {
    case 'date': repairs.sort((a,b) => b.id.localeCompare(a.id)); break;
    case 'cost': repairs.sort((a,b) => (b.cost||0) - (a.cost||0)); break;
    case 'status': repairs.sort((a,b) => a.status.localeCompare(b.status)); break;
  }

  const tbody = document.querySelector('#customerTable tbody');
  tbody.innerHTML = repairs.map(r => `
    <tr>
      <td>${r.custName}</td>
      <td>${r.custPhone}</td>
      <td>${r.custBrand || ''} ${r.custModel || ''}</td>
      <td>${r.imei || '-'}</td>
      <td>${r.problemDesc}</td>
      <td>${curr}${r.cost} (Adv ${curr}${r.advance || 0})</td>
      <td>${createStatusBadge(r.status)}</td>
      <td>${r.expectedDelivery || '-'}</td>
      <td>
        <button class="btn-icon details" onclick="openDetailsModal('${r.id}')"><i class="fas fa-info-circle"></i></button>
        <button class="btn-icon job-sheet" onclick="openJobSheet('${r.id}')"><i class="fas fa-clipboard-list"></i></button>
        <button class="btn-icon edit" onclick="editRepair('${r.id}')"><i class="fas fa-edit"></i></button>
        <button class="btn-icon delete" onclick="deleteRepairConfirm('${r.id}')"><i class="fas fa-trash"></i></button>
      </td>
    </tr>
  `).join('');
}

// ---------- Bill ----------
function populateBillSelect() {
  const repairs = getRepairs();
  document.getElementById('billCustomerSelect').innerHTML = '<option value="">-- Choose --</option>' + repairs.map(r => `<option value="${r.id}">${r.custName} (${r.custPhone})</option>`).join('');
}

function generateBill() {
  const id = document.getElementById('billCustomerSelect').value;
  if (!id) return alert('Select a customer.');
  const repair = getRepairs().find(r => r.id === id);
  if (!repair) return;
  const shop = getShopSettings();
  const curr = shop.currency || '₹';
  const gst = calculateGST(repair.cost);
  const total = repair.cost + gst;
  const remaining = calculateRemaining(repair.cost, repair.advance || 0);
  document.getElementById('billContent').innerHTML = `
    <div style="max-width:600px;margin:0 auto;">
      <div style="display:flex;justify-content:space-between;border-bottom:2px solid #000;padding-bottom:10px;">
        <div><h2>${shop.shopName}</h2><p>${shop.address}</p><p>📞 ${shop.phone} | ✉️ ${shop.email}</p><p>GST: ${shop.gst}</p></div>
        <div><h1>INVOICE</h1><p>#${generateBillNumber()}</p><p>Date: ${new Date().toLocaleDateString()}</p></div>
      </div>
      <h3>Customer: ${repair.custName} (${repair.custPhone})</h3>
      <p>Model: ${repair.custBrand} ${repair.custModel} | IMEI: ${repair.imei || 'N/A'}</p>
      <p>Problem: ${repair.problemDesc}</p>
      <hr>
      <p>Cost: ${curr}${repair.cost}</p>
      <p>GST (18%): ${curr}${gst.toFixed(2)}</p>
      <p>Total: ${curr}${total.toFixed(2)}</p>
      <p>Advance: ${curr}${repair.advance || 0} | Remaining: ${curr}${remaining.toFixed(2)}</p>
      <p>Status: ${repair.status} | Expected: ${repair.expectedDelivery || 'N/A'}</p>
    </div>
  `;
  document.getElementById('billContainer').classList.remove('hidden');
}

// ---------- Timeline & Notes Modal ----------
window.openDetailsModal = function(id) {
  const repair = getRepairs().find(r => r.id === id);
  if (!repair) return;
  currentDetailId = id;
  document.getElementById('tabTimeline').innerHTML = `<h3>Timeline</h3>` + (repair.timeline || []).map(t => `<p><strong>${t.time}</strong> – ${t.status}</p>`).join('');
  renderNotes();
  renderLoyalty();
  document.getElementById('detailsModal').classList.remove('hidden');
  document.querySelector('.tab[onclick*="timeline"]').classList.add('active');
  document.getElementById('tabTimeline').classList.add('active');
};

function closeDetailsModal() {
  document.getElementById('detailsModal').classList.add('hidden');
}

function switchTab(tab) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.querySelector(`.tab[onclick*="${tab}"]`).classList.add('active');
  document.getElementById(`tab${tab.charAt(0).toUpperCase() + tab.slice(1)}`).classList.add('active');
}

let currentDetailId = null;

function renderNotes() {
  const repair = getRepairs().find(r => r.id === currentDetailId);
  document.getElementById('notesList').innerHTML = (repair.notes || []).map((n, i) => `<p>${i+1}. ${n} <button class="btn-icon delete" onclick="deleteNote(${i})"><i class="fas fa-times"></i></button></p>`).join('');
}

function addNote() {
  const note = document.getElementById('newNote').value.trim();
  if (!note) return;
  const repairs = getRepairs();
  const repair = repairs.find(r => r.id === currentDetailId);
  if (repair) {
    if (!repair.notes) repair.notes = [];
    repair.notes.push(note);
    saveRepairs(repairs);
    document.getElementById('newNote').value = '';
    renderNotes();
  }
}

function deleteNote(index) {
  const repairs = getRepairs();
  const repair = repairs.find(r => r.id === currentDetailId);
  if (repair) {
    repair.notes.splice(index, 1);
    saveRepairs(repairs);
    renderNotes();
  }
}

// ---------- Loyalty (Surprise Feature) ----------
function renderLoyalty() {
  const repair = getRepairs().find(r => r.id === currentDetailId);
  const allRepairs = getRepairs().filter(r => r.custPhone === repair.custPhone);
  const count = allRepairs.length;
  let msg = '';
  if (count >= 5) {
    msg = `🎉 Loyal Customer! ${count} repairs done. Next repair gets 10% discount.`;
  } else if (count >= 3) {
    msg = `👍 Returning customer (${count} repairs). 5% discount on next service.`;
  } else {
    msg = `New customer (${count} repair(s)).`;
  }
  document.getElementById('tabLoyalty').innerHTML = `<h3>Loyalty Status</h3><p>${msg}</p><p>Total repairs by ${repair.custName}: ${count}</p>`;
}

// ---------- Job Sheet (global) ----------
window.openJobSheet = function(id) {
  const repair = getRepairs().find(r => r.id === id);
  if (!repair) return;
  const shop = getShopSettings();
  const curr = shop.currency || '₹';
  document.getElementById('jobSheetContent').innerHTML = `
    <div style="max-width:650px;margin:0 auto;">
      <div style="display:flex;justify-content:space-between;border-bottom:2px solid #000;padding-bottom:10px;">
        <div><h2>${shop.shopName}</h2><p>${shop.address}</p><p>📞 ${shop.phone} | ✉️ ${shop.email}</p><p>GST: ${shop.gst}</p></div>
        <div><h1>JOB SHEET</h1><p>Job #: JS-${id.slice(-6)}</p><p>Date: ${repair.dateReceived || new Date().toLocaleDateString()}</p></div>
      </div>
      <h3>Customer: ${repair.custName} (${repair.custPhone})</h3>
      <p>Model: ${repair.custBrand} ${repair.custModel} | IMEI: ${repair.imei || 'N/A'}</p>
      <p>Problem: ${repair.problemDesc}</p>
      <p>Cost: ${curr}${repair.cost} | Advance: ${curr}${repair.advance || 0}</p>
      <p>Expected Delivery: ${repair.expectedDelivery || 'Not specified'}</p>
      <hr>
      <p>Customer Signature: ________________________</p>
      <p>Technician: ________________________</p>
    </div>
  `;
  document.getElementById('jobSheetModal').classList.remove('hidden');
};
window.closeJobSheet = () => document.getElementById('jobSheetModal').classList.add('hidden');

// ---------- Export ----------
function exportJSON() {
  const repairs = getRepairs();
  const blob = new Blob([JSON.stringify(repairs, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'repairflow_backup.json'; a.click();
  URL.revokeObjectURL(url);
}
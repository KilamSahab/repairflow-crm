// Navigation
document.querySelectorAll('.nav-item[data-page]').forEach(item => {
  item.addEventListener('click', function(e) {
    e.preventDefault();
    document.querySelectorAll('.nav-item[data-page]').forEach(i => i.classList.remove('active'));
    this.classList.add('active');
    const page = this.dataset.page;
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    switch(page) {
      case 'dashboard': document.getElementById('dashboardPage').classList.add('active'); updateDashboard(); break;
      case 'customers': document.getElementById('customersPage').classList.add('active'); renderCustomerList(); break;
      case 'add-repair': document.getElementById('addRepairPage').classList.add('active'); resetForm(); break;
      case 'bill': document.getElementById('billPage').classList.add('active'); populateBillSelect(); document.getElementById('billContainer').classList.add('hidden'); break;
    }
  });
});

// Form
const form = document.getElementById('repairForm');
const feedbackDiv = document.getElementById('formFeedback');

function resetForm() {
  form.reset();
  document.getElementById('editId').value = '';
  document.getElementById('formTitle').textContent = 'New Repair';
  document.getElementById('dateReceived').valueAsDate = new Date();
  document.getElementById('expectedDelivery').value = '';
  hideFeedback();
}

window.editRepair = function(id) {
  const repair = getRepairs().find(r => r.id === id);
  if (!repair) return;
  document.getElementById('editId').value = repair.id;
  document.getElementById('custName').value = repair.custName || '';
  document.getElementById('custPhone').value = repair.custPhone || '';
  document.getElementById('custBrand').value = repair.custBrand || '';
  document.getElementById('custModel').value = repair.custModel || '';
  document.getElementById('custIMEI').value = repair.imei || '';
  document.getElementById('repairCost').value = repair.cost || 0;
  document.getElementById('advancePaid').value = repair.advance || 0;
  document.getElementById('repairStatus').value = repair.status || 'Pending';
  document.getElementById('problemDesc').value = repair.problemDesc || '';
  document.getElementById('dateReceived').value = repair.dateReceived || '';
  document.getElementById('expectedDelivery').value = repair.expectedDelivery || '';
  document.getElementById('formTitle').textContent = 'Edit Repair';
  navigateToPage('add-repair');
  setTimeout(() => document.getElementById('addRepairPage').scrollIntoView({ behavior: 'smooth' }), 100);
};

window.deleteRepairConfirm = function(id) {
  if (confirm('Delete this repair permanently?')) {
    deleteRepair(id);
    refreshActiveView();
  }
};

form.addEventListener('submit', function(e) {
  e.preventDefault();
  const id = document.getElementById('editId').value;
  const repairData = {
    custName: document.getElementById('custName').value.trim(),
    custPhone: document.getElementById('custPhone').value.trim(),
    custBrand: document.getElementById('custBrand').value.trim(),
    custModel: document.getElementById('custModel').value.trim(),
    imei: document.getElementById('custIMEI').value.trim(),
    cost: parseFloat(document.getElementById('repairCost').value) || 0,
    advance: parseFloat(document.getElementById('advancePaid').value) || 0,
    status: document.getElementById('repairStatus').value,
    problemDesc: document.getElementById('problemDesc').value.trim(),
    dateReceived: document.getElementById('dateReceived').value,
    expectedDelivery: document.getElementById('expectedDelivery').value
  };

  if (!repairData.custName) return showFeedback('Name required', 'error');
  if (!isValidPhone(repairData.custPhone)) return showFeedback('Invalid phone', 'error');

  if (id) {
    // Update existing – keep timeline & notes
    const old = getRepairs().find(r => r.id === id);
    if (old && old.status !== repairData.status) {
      // Add timeline entry
      if (!old.timeline) old.timeline = [];
      old.timeline.push({ time: new Date().toLocaleString(), status: repairData.status });
      repairData.timeline = old.timeline;
      repairData.notes = old.notes || [];
    }
    updateRepair(id, repairData);
    showFeedback('Updated!', 'success');
  } else {
    addRepair(repairData);
    showFeedback('Added!', 'success');
    resetForm();
  }
  refreshActiveView();
});

function showFeedback(msg, type) { feedbackDiv.textContent = msg; feedbackDiv.className = 'feedback-message ' + type; setTimeout(() => feedbackDiv.className = 'feedback-message', 3000); }
function hideFeedback() { feedbackDiv.className = 'feedback-message'; }
window.cancelEdit = function() { resetForm(); navigateToPage('dashboard'); };

function navigateToPage(pageName) {
  document.querySelectorAll('.nav-item[data-page]').forEach(i => {
    i.classList.remove('active');
    if (i.dataset.page === pageName) i.classList.add('active');
  });
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const map = { dashboard: 'dashboardPage', customers: 'customersPage', 'add-repair': 'addRepairPage', bill: 'billPage' };
  if (map[pageName]) document.getElementById(map[pageName]).classList.add('active');
  refreshActiveView();
}

function refreshActiveView() {
  if (document.getElementById('dashboardPage').classList.contains('active')) updateDashboard();
  if (document.getElementById('customersPage').classList.contains('active')) renderCustomerList();
  if (document.getElementById('billPage').classList.contains('active')) populateBillSelect();
}

// Search & filters
document.getElementById('searchInput')?.addEventListener('input', () => debounce(() => renderCustomerList()));
document.getElementById('filterStatus')?.addEventListener('change', renderCustomerList);
document.getElementById('sortBy')?.addEventListener('change', renderCustomerList);

// Init
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('dateReceived').valueAsDate = new Date();
  updateDashboard();
  renderCustomerList();
});
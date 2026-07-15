function calculateGST(amount, rate = 18) { return amount * (rate / 100); }
function calculateRemaining(totalCost, advancePaid) { return totalCost - advancePaid; }
function isValidPhone(phone) { return /^[6-9]\d{9}$/.test(phone); }
function generateBillNumber() { return 'BILL-' + Date.now().toString(36).toUpperCase(); }
function findPendingRepairs(repairs) { return repairs.filter(r => r.status !== 'Completed'); }
function countCompleted(repairs) { return repairs.filter(r => r.status === 'Completed').length; }
function searchCustomers(repairs, query) {
  const q = query.toLowerCase();
  return repairs.filter(r =>
    r.custName.toLowerCase().includes(q) ||
    r.custPhone.includes(q) ||
    (r.imei && r.imei.includes(q)) ||
    (r.custModel && r.custModel.toLowerCase().includes(q))
  );
}
function createStatusBadge(status) {
  const map = {
    'Pending': 'badge-pending',
    'In Progress': 'badge-progress',
    'Ready': 'badge-ready',
    'Completed': 'badge-completed'
  };
  return `<span class="badge ${map[status] || ''}">${status}</span>`;
}
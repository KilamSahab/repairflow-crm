const STORAGE_KEY = 'repairs_v4';
const SHOP_SETTINGS_KEY = 'shop_settings_v4';

// Safe JSON parse
function safeParse(json) {
  try {
    return JSON.parse(json);
  } catch (e) {
    console.error('Data corrupted, resetting.');
    return null;
  }
}

function getRepairs() {
  const raw = localStorage.getItem(STORAGE_KEY);
  const data = safeParse(raw);
  return Array.isArray(data) ? data : [];
}

function saveRepairs(repairs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(repairs));
  } catch (e) {
    alert('Storage full. Please export your data and clear some records.');
  }
}

function addRepair(repair) {
  const repairs = getRepairs();
  repair.id = Date.now().toString();
  repair.createdAt = new Date().toISOString();
  repair.timeline = [{ time: new Date().toLocaleString(), status: 'Device Received' }];
  repair.notes = [];
  repairs.push(repair);
  saveRepairs(repairs);
  return repair;
}

function updateRepair(id, updatedData) {
  const repairs = getRepairs();
  const index = repairs.findIndex(r => r.id === id);
  if (index !== -1) {
    repairs[index] = { ...repairs[index], ...updatedData };
    saveRepairs(repairs);
  }
}

function deleteRepair(id) {
  const repairs = getRepairs().filter(r => r.id !== id);
  saveRepairs(repairs);
}

// Shop Settings
function getShopSettings() {
  const defaults = {
    shopName: 'Laxmi Mobiles',
    ownerName: 'Kilam Sahab',
    phone: '9876543210',
    email: 'laxmi@mobile.com',
    address: 'Near Railway Station, Nagpur',
    gst: '22AAAAA0000A1Z5',
    currency: '₹',
    theme: 'Light'
  };
  const raw = localStorage.getItem(SHOP_SETTINGS_KEY);
  const saved = safeParse(raw);
  return { ...defaults, ...(saved || {}) };
}

function saveShopSettings(settings) {
  localStorage.setItem(SHOP_SETTINGS_KEY, JSON.stringify(settings));
}
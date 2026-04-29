const masterToggle = document.getElementById('masterToggle');
const list = document.getElementById('list');

const setListEnabled = (enabled) => {
  list.dataset.disabled = String(!enabled);
};

chrome.storage.sync.get('extensionEnabled', ({ extensionEnabled }) => {
  const on = extensionEnabled !== false;
  masterToggle.checked = on;
  setListEnabled(on);
});

masterToggle.addEventListener('change', () => {
  chrome.storage.sync.set({ extensionEnabled: masterToggle.checked });
  setListEnabled(masterToggle.checked);
});

chrome.storage.sync.get('visiblePills', ({ visiblePills }) => {
  const settings = visiblePills || {};
  PILLS.forEach(({ key, label, defaultVisible }) => {
    const row = document.createElement('label');
    row.className = 'row';

    const text = document.createElement('span');
    text.className = 'row-label';
    text.textContent = label;

    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.className = 'toggle';
    cb.checked = key in settings ? settings[key] : defaultVisible;
    cb.addEventListener('change', () => {
      chrome.storage.sync.get('visiblePills', ({ visiblePills }) => {
        const next = { ...(visiblePills || {}), [key]: cb.checked };
        chrome.storage.sync.set({ visiblePills: next });
      });
    });

    row.append(text, cb);
    list.appendChild(row);
  });
});

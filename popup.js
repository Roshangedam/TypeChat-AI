document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const volumeSlider = document.getElementById('volume');
    const volumeValue = document.getElementById('volume-value');
    const enabledToggle = document.getElementById('enabled');
    const aboutMeDialog = document.getElementById('aboutMeDialog');
    const aboutAppDialog = document.getElementById('aboutAppDialog');
    const aboutMeBtn = document.getElementById('aboutMeBtn');
    const aboutAppBtn = document.getElementById('aboutAppBtn');
    const closeDialogBtns = document.querySelectorAll('.close-dialog');

    // Dialog Control Functions
    function showDialog(dialog) {
        if (dialog) {
            dialog.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }

    function hideDialog(dialog) {
        if (dialog) {
            dialog.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    // Volume Control
    function updateVolume(value) {
        volumeValue.textContent = value + '%';
        chrome.storage.sync.set({ volume: parseInt(value) }, function() {
            if (chrome.runtime.lastError) {
                console.error('Error saving volume:', chrome.runtime.lastError);
                return;
            }
            // Send message to content script
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                if (tabs[0]) {
                    chrome.tabs.sendMessage(tabs[0].id, {
                        type: 'UPDATE_VOLUME',
                        volume: parseInt(value) / 100
                    });
                }
            });
        });
    }

    volumeSlider.addEventListener('input', function() {
        updateVolume(this.value);
    });

    // Enable/Disable Toggle
    function updateEnabled(checked) {
        chrome.storage.sync.set({ enabled: checked }, function() {
            if (chrome.runtime.lastError) {
                console.error('Error saving enabled state:', chrome.runtime.lastError);
                return;
            }
            // Send message to content script
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                if (tabs[0]) {
                    chrome.tabs.sendMessage(tabs[0].id, {
                        type: 'UPDATE_ENABLED',
                        enabled: checked
                    });
                }
            });
        });
    }

    enabledToggle.addEventListener('change', function() {
        updateEnabled(this.checked);
    });

    // Load Saved Settings
    chrome.storage.sync.get(['volume', 'enabled'], function(data) {
        if (chrome.runtime.lastError) {
            console.error('Error loading settings:', chrome.runtime.lastError);
            return;
        }

        if (data.volume !== undefined) {
            volumeSlider.value = data.volume;
            volumeValue.textContent = data.volume + '%';
        } else {
            // Set default volume to 50%
            updateVolume(50);
            volumeSlider.value = 50;
        }

        if (data.enabled !== undefined) {
            enabledToggle.checked = data.enabled;
        } else {
            // Set default enabled state to true
            updateEnabled(true);
            enabledToggle.checked = true;
        }
    });

    // Dialog Button Event Listeners
    aboutMeBtn.addEventListener('click', () => showDialog(aboutMeDialog));
    aboutAppBtn.addEventListener('click', () => showDialog(aboutAppDialog));

    // Close Dialog Event Listeners
    closeDialogBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            hideDialog(btn.closest('.dialog-overlay'));
        });
    });

    // Close Dialog on Outside Click
    [aboutMeDialog, aboutAppDialog].forEach(dialog => {
        dialog.addEventListener('click', function(e) {
            if (e.target === dialog) {
                hideDialog(dialog);
            }
        });
    });

    // Handle Escape Key Press
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const visibleDialog = document.querySelector('.dialog-overlay[style*="display: flex"]');
            if (visibleDialog) {
                hideDialog(visibleDialog);
            }
        }
    });
});
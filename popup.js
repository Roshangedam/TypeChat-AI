document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
    const volumeSlider = document.getElementById('volume');
    const volumeValue = document.getElementById('volume-value');
    const enabledToggle = document.getElementById('enabled');
    const aboutMeBtn = document.getElementById('aboutMeBtn');
    const aboutAppBtn = document.getElementById('aboutAppBtn');
    const aboutMeDialog = document.getElementById('aboutMeDialog');
    const aboutAppDialog = document.getElementById('aboutAppDialog');
    const closeButtons = document.querySelectorAll('.close-dialog');

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

    // Dialog handling functions
    const openDialog = (dialog) => {
        dialog.classList.add('active');
    };

    const closeDialog = (dialog) => {
        dialog.classList.remove('active');
    };

    // Add click event listeners for buttons
    aboutMeBtn.addEventListener('click', () => openDialog(aboutMeDialog));
    aboutAppBtn.addEventListener('click', () => openDialog(aboutAppDialog));

    // Close dialog when clicking close button
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            const dialog = button.closest('.dialog-overlay');
            closeDialog(dialog);
        });
    });

    // Close dialog when clicking outside
    document.addEventListener('click', (event) => {
        if (event.target.classList.contains('dialog-overlay')) {
            closeDialog(event.target);
        }
    });

    // Handle keyboard events
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            const activeDialog = document.querySelector('.dialog-overlay.active');
            if (activeDialog) {
                closeDialog(activeDialog);
            }
        }
    });
})
// Browser detection utility
const browserAPI = (function() {
    if (typeof chrome !== 'undefined') {
        return chrome;
    } else if (typeof browser !== 'undefined') {
        return browser;
    } else if (typeof msBrowser !== 'undefined') {
        return msBrowser;
    } else {
        throw new Error('Browser API not supported');
    }
})();

// Standard Configuration
const config = {
    targetClassNames: ['markdown','ds-markdown','font-claude-message'],
    mutationConfig: {
        childList: true,
        attributes: true,
        subtree: true,
        characterData: true
    },
    extensionConfig: {
        logMutations: false,
        playSoundOnCharacterChange: true,
        customActions: []
    }
};

// Keep track of currently playing audio and settings
let currentAudio = null;
let volume = 0.5; // Default volume
let isEnabled = true; // Default enabled state
let autoScroll = true; // Default auto-scroll state

function getRandomAudioFile() {
    const randomNumber = Math.floor(Math.random() * 5) + 1;
    return `press${randomNumber}.mp3`;
}

// Function to stop current audio if playing
function stopCurrentAudio() {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio = null;
    }
}

// Function to execute common logic for all mutations
function executeCommonLogic(mutationType, mutationDetail) {
    if (config.extensionConfig.logMutations) {
        console.log(`Mutation Type: ${mutationType}, Detail:`, mutationDetail);
    }

    config.extensionConfig.customActions.forEach(action => {
        if (typeof action === 'function') {
            action(mutationType, mutationDetail);
        }
    });

    // Stop any currently playing audio before playing new one
    stopCurrentAudio();

    if (!isEnabled) return;

    // Auto-scroll to bottom if enabled
    if (autoScroll) {
        // Find the scrollable container element
        const scrollableElements = Array.from(document.querySelectorAll('*')).filter(el => {
            const style = window.getComputedStyle(el);
            return (style.overflowY === 'auto' || style.overflowY === 'scroll') &&
                   el.scrollHeight > el.clientHeight;
        });

        // Find the most relevant scrollable container (the one containing our target elements)
        const chatContainer = scrollableElements.find(el => {
            return config.targetClassNames.some(className =>
                el.querySelector(`.${className}`) !== null
            );
        });

        // If found, scroll the container to bottom, otherwise fallback to window scroll
        if (chatContainer) {
            chatContainer.scrollTo({
                top: chatContainer.scrollHeight,
                behavior: 'smooth'
            });
        } else {
            window.scrollTo({
                top: document.body.scrollHeight,
                behavior: 'smooth'
            });
        }
    }

    let audioFile = getRandomAudioFile();
    currentAudio = new Audio(browserAPI.runtime.getURL(`audio/${audioFile}`));
    currentAudio.volume = volume;
    currentAudio.play().catch(error => {
        if (config.extensionConfig.logMutations) {
          console.error('Error playing sound:', error);
        }
        currentAudio = null;
    });
}

// Define a MutationObserver callback function to track different mutations
const observerCallback = function (mutationsList, observer) {
    for (let mutation of mutationsList) {
        switch (mutation.type) {
            case 'childList':
                executeCommonLogic('childList', 'Text content of label changed: ' + mutation.target.textContent);
                break;
            case 'attributes':
                executeCommonLogic('attributes', {
                    attributeName: mutation.attributeName,
                    newValue: mutation.target.getAttribute(mutation.attributeName)
                });
                break;
            case 'subtree':
                executeCommonLogic('subtree', 'Subtree changes detected');
                break;
            case 'characterData':
                executeCommonLogic('characterData', mutation.target.data);
                break;
            default:
                break;
        }
    }
};

// Create a MutationObserver instance and pass the callback function
const observer = new MutationObserver(observerCallback);

// Function to observe multiple elements based on class names
function observeMultipleElements() {
    config.targetClassNames.forEach(className => {
        const targetElements = document.querySelectorAll(`.${className}`);
        targetElements.forEach(targetElement => {
            observer.observe(targetElement, config.mutationConfig);
        });
    });
}

// Function to handle dynamically added elements
function observeDynamicallyAddedElements() {
    const bodyObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.addedNodes && mutation.addedNodes.length > 0) {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) { // Check if it's an element node
                        config.targetClassNames.forEach(className => {
                            if (node.classList && node.classList.contains(className)) {
                                observer.observe(node, config.mutationConfig);
                            }
                            // Also check for matching elements within the added node
                            const targetElements = node.querySelectorAll(`.${className}`);
                            targetElements.forEach(targetElement => {
                                observer.observe(targetElement, config.mutationConfig);
                            });
                        });
                    }
                });
            }
        });
    });

    // Start observing the document body for dynamically added elements
    bodyObserver.observe(document.body, {
        childList: true,
        subtree: true
    });
}

// Listen for messages from popup
browserAPI.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.type) {
        case 'UPDATE_VOLUME':
            volume = message.volume;
            break;
        case 'UPDATE_ENABLED':
            isEnabled = message.enabled;
            if (!isEnabled) {
                stopCurrentAudio();
            }
            break;
        case 'UPDATE_AUTO_SCROLL':
            autoScroll = message.autoScroll;
            break;
        case 'updateSettings':
            if (message.volume !== undefined) volume = message.volume;
            if (message.enabled !== undefined) {
                isEnabled = message.enabled;
                if (!isEnabled) stopCurrentAudio();
            }
            if (message.autoScroll !== undefined) autoScroll = message.autoScroll;
            break;
    }
});

// Load saved settings
browserAPI.storage.sync.get(['volume', 'enabled', 'autoScroll'], (result) => {
    if (result.volume !== undefined) {
        volume = result.volume / 100; // Convert from percentage to 0-1 range
    }
    if (result.enabled !== undefined) {
        isEnabled = result.enabled;
    }
    if (result.autoScroll !== undefined) {
        autoScroll = result.autoScroll;
    }
});

// Initialize observers when the content script loads
observeMultipleElements();
observeDynamicallyAddedElements();


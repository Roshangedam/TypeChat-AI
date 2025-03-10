// Standard Configuration
const config = {
    targetClassNames: ['markdown','ds-deepseek'],
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

// Keep track of currently playing audio
let currentAudio = null;

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

    let audioFile = getRandomAudioFile();
    currentAudio = new Audio(chrome.runtime.getURL(`audio/${audioFile}`));
    currentAudio.play().catch(error => {
        console.error('Error playing sound:', error);
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

// Initialize observers when the content script loads
observeMultipleElements();
observeDynamicallyAddedElements();


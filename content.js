// Standard Configuration
const config = {
    targetClassNames: ['markdown'], // List of class names of elements to target
    mutationConfig: {
        childList: true,  // Track changes in child nodes (like text content changes)
        attributes: true, // Track changes in attributes (like 'for' attribute or class)
        subtree: true,    // Track changes in the subtree (any nested elements inside the label)
        characterData: true // Track changes in the text data of nodes
    },
    extensionConfig: {
        // Additional extensions for customization
        logMutations: false, // Enable or disable logging
        playSoundOnCharacterChange: true, // Play sound on character changes
        customActions: [] // Custom actions to be executed for mutations
    }
};

function getRandomAudioFile() {
    const randomNumber = Math.floor(Math.random() * 5) + 1; // Random number between 1 and 6
    return `press${randomNumber}.mp3`; // Generate the file name like press1.mp3, press2.mp3, ..., press6.mp3
}




// Function to execute common logic for all mutations
function executeCommonLogic(mutationType, mutationDetail) {

    if (config.extensionConfig.logMutations) {
        console.log(`Mutation Type: ${mutationType}, Detail:`, mutationDetail);
    }

    // Execute custom actions from extensionConfig if provided
    config.extensionConfig.customActions.forEach(action => {
        if (typeof action === 'function') {
            action(mutationType, mutationDetail);
        }
    });
    let audioFile = getRandomAudioFile();
    let sound = new Audio(chrome.runtime.getURL(`audio/${audioFile}`));
    sound.play().catch(error => {
        console.error('Error playing sound:', error);
    });

 
    // // Play sound when character data changes and the extension config allows it
    // if (mutationType === 'characterData' && config.extensionConfig.playSoundOnCharacterChange) {
    //     sound.play();  // Play sound when character data changes (text added or modified)
    // }

    // if(mutationType=='characterData' || mutationType== 'childList' ){        
    //     console.log(mutationDetail);
    // }
    // console.log("Mutation Type:", mutationType); 
    // mutationType='characterData'|,'attributes' |,'subtree'
    // You can add common actions or logic here like updating UI, calling APIs, etc.
}

// Define a MutationObserver callback function to track different mutations
const observerCallback = function (mutationsList, observer) {
    for (let mutation of mutationsList) {
        // Check mutation type and execute common logic accordingly
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
            // Start observing each target element for changes with the specified configuration
            observer.observe(targetElement, config.mutationConfig);
        });
    });
}

// Function to handle dynamically added elements
function observeDynamicallyAddedElements() {
    // Observer for detecting added or removed elements in the DOM
    const dynamicObserver = new MutationObserver(function (mutationsList) {
        mutationsList.forEach(mutation => {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(node => {
                    // Check if the added node matches the target class name
                    if (node.nodeType === 1 && node.classList.contains(config.targetClassNames[0])) {
                        console.log("Dynamically added element detected:", node);
                        // Now observe the newly added element
                        observer.observe(node, config.mutationConfig);
                    }
                });
            }
        });
    });

    // Start observing the body or any parent element for changes
    dynamicObserver.observe(document.body, { childList: true, subtree: true });
}

// Main function to configure and initialize everything
function main() {
    // Step 1: Observe existing elements when the page loads
    observeMultipleElements();

    // Step 2: Handle dynamically added elements
    observeDynamicallyAddedElements();
}

// Run the main function when the page loads
window.onload = main;


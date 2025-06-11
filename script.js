// ==UserScript==
// @name         Textarea Console Command
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Changes the title of a Twitch stream using a console command.
// @author       Eclassic32
// @match        *://dashboard.twitch.tv/popout/u/*/stream-manager/edit-stream-info
// @grant        none
// ==/UserScript==
(function() {
    'use strict';
    const checkboxNames = ['Rerun', 'Branded', "Politics", "Drugs", "Gambling", "Mature", "Profanity", "Sexual", "Violence"];

    const initObserver = new MutationObserver(() => {
        if (document.getElementById("Tags-Selector")) {
            initObserver.disconnect(); // Stop observing once found
            init();
            console.log("✅ Twitch Stream Manager initialized successfully.");
        }
    });
    initObserver.observe(document.body, {
        childList: true,
        subtree: true,
    });

    window.el = {
        title: '',
        notifications: '',
        category: '',
        tagSelector: '',
        currentTags: [],
        language: '',
        btnClassification: '',
        classifications: [],
        rerun: '',
        branded: '',
    }

    // Title and Notifications Textarea
    function ChangeTextbox(textarea, text) {
        try {
            // Use native input value setter to bypass React's value control
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                window.HTMLTextAreaElement.prototype, 
                'value'
            ).set;
            
            nativeInputValueSetter.call(textarea, text);
            
            // Create and dispatch React-compatible input event
            const inputEvent = new Event('input', { bubbles: true });
            Object.defineProperty(inputEvent, 'target', { 
                writable: false, 
                value: textarea 
            });
            
            textarea.dispatchEvent(inputEvent);
            console.log(`✅ ${textarea.dataset.saverName} (${textarea.id}) changed to: "${text}"`);
            
            return true;
            
        } catch (error) {
            console.error(`❌ Error updating ${textarea.dataset.saverName} (${textarea.id}):`, error);
            return false;
        }
    }

    window.changeTextbox = function(textbox, text) {
        init();

        if (typeof text !== 'string') {
            console.error('❌ Please provide a string. Usage: changeTextbox(el.element, "Your text here")');
            return false;
        }   

        return ChangeTextbox(textbox, text);
    };

    // Tags and Classification
    
    async function deleteAllTags() {
    for (let i = el.currentTags.length - 1; i >= 0; i--) {
        const activeTag = el.currentTags[i];
        activeTag.click();

        // Wait for the specific tag to be removed
        await new Promise((resolve) => {
            const observer = new MutationObserver((mutations) => {
                for (const mutation of mutations) {
                    if (mutation.type === 'childList') {
                        for (const node of mutation.removedNodes) {
                            if (node === activeTag || node.contains(activeTag)) {
                                observer.disconnect();
                                resolve();
                                return;
                            }
                        }
                    }
                }
            });
            observer.observe(document.body, { childList: true, subtree: true });
        });
    }
    return true;
    }
    function addTag(input, text) {
        const reactKey = Object.keys(input).find(key => key.startsWith('__react'));
        if (!reactKey) {
            console.error('❌ React instance not found');
            return false;
        }
        try {
            // Use native input value setter to bypass React's value control
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                window.HTMLInputElement.prototype, 'value'
            ).set;
            nativeInputValueSetter.call(input, text);
            
            // Create and dispatch React-compatible input event
            const inputEvent = new Event('input', { bubbles: true });
            Object.defineProperty(inputEvent, 'target', { 
                writable: false, 
                value: input 
            });
            input.dispatchEvent(inputEvent);
            
            // Simulate a keydown "Enter"
            const enterEvent = new KeyboardEvent('keydown', {
                bubbles: true,
                cancelable: true,
                key: 'Enter',
                code: 'Enter',
                keyCode: 13
            });
            input.dispatchEvent(enterEvent);

            console.log(`✅ ${input.dataset.saverName} (${input.id}) added tag: "${text}"`);
            return true;

        } catch (error) {
            console.error(`❌ Error updating ${input.dataset.saverName} (${input.id}):`, error);
            return false;
        }
    }
    
    window.addTag = addTag;
    window.deleteAllTags = deleteAllTags;
    
    // Rerun and Branded Content
    function toggleCheckboxes(checkbox, state) {
        if (!checkbox || !checkbox.id) {
            console.error('❌ Invalid checkbox element provided.');
            return false;
        }

        if (checkbox.checked !== state) {
            checkbox.click();
            console.log(`✅ ${checkbox.dataset.saverName} (${checkbox.id}) set to: ${state}`);
        } else {
            console.log(`ℹ ${checkbox.dataset.saverName} (${checkbox.id}) is already set to: ${state}`);
        }
        return true;
    }

    window.toggleCheckboxes = toggleCheckboxes;

    // Category
    function ChangeCategory(selector, text) {
        try {
            if (document.querySelector(".category-details")){
                if (document.querySelector(".category-details .category-details__name-text").textContent === text) {
                    console.log(`❗ ${selector.dataset.saverName} (${selector.id}) is already set to: "${text}"`);
                    return true;
                }

                document.querySelector(".category-details button[aria-label=\"Cancel\"]").click();
            }

            // Use native input value setter to bypass React's value control
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                window.HTMLInputElement.prototype,
                'value'
            ).set;
            
            nativeInputValueSetter.call(selector, text);
            
            // Create and dispatch React-compatible input event
            const inputEvent = new Event('input', { bubbles: true });
            Object.defineProperty(inputEvent, 'target', { 
                writable: false, 
                value: selector 
            });
            selector.dispatchEvent(inputEvent);
            
            const observer = new MutationObserver(() => {
                if (el.categoryDropdown.children[0].type === "submit") {
                    observer.disconnect();
                    
                    // Select the first element in the dropdown
                    window.el.categoryDropdown.children[0].click();
                }
                    
            });
            observer.observe(document.body, {
                childList: true,
                subtree: true,
            });

            console.log(`✅ ${selector.dataset.saverName} (${selector.id}) changed to: "${text}"`);
            return true;
            
        } catch (error) {
            console.error(`❌ Error updating ${selector.dataset.saverName} (${selector.id}):`, error);
            return false;
        }
    }
    window.ChangeCategory = ChangeCategory;

    // Stream Language

    // Content Classification
    async function parseClassifications(index, state = null) {
        return new Promise((resolve) => {
            const observer = new MutationObserver(() => {
                if (document.body.lastElementChild.classList.contains("tw-dialog-layer")) {
                    observer.disconnect(); // Stop observing once found

                    let allCheckboxLabels = document.querySelectorAll("label.tw-checkbox__label");
                    let checkbox = document.getElementById(allCheckboxLabels[index].htmlFor);
                    checkbox.dataset.saverName = "Classification " + (checkboxNames[index] || index);

                    if (state !== null) {
                        resolve(toggleCheckboxes(checkbox, state));
                    } else {
                        resolve(checkbox.checked);
                    }
                }
            });

            window.el.btnClassification.click();
            observer.observe(document.body, {
                childList: true,
                subtree: true,
            });
        });
    }
    window.parseClassifications = parseClassifications;

    // Initialization
    function selectGroupFromLabel(label){
        return label.parentElement.parentElement.parentElement;
    }

    function dataInput(name, element, beautify = false){
        window.el[name] = element;
        if (beautify) {
            element.dataset.saverName = beautify;
        }
    }

    function init() {
        const path = (window.location.pathname).split("/")
        const allLablels = document.querySelectorAll("label");

        dataInput("title", document.querySelector(`#edit-broadcast-title-formgroup`), "Title");
        dataInput("notifications", document.querySelector(`[placeholder="${path[3]} went live!"]`), "Notifications");

        dataInput("categorySelector", document.getElementById("Category-Selector"), "Category Selector");
        dataInput("categoryDropdown",  document.querySelector(".edit-broadcast__category-dropdown-search .simplebar-content").children[0], "Category Dropdown");

        
        dataInput("tagSelector", document.querySelector("#Tags-Selector"), "Tag Selector");
        dataInput("currentTags", selectGroupFromLabel(allLablels[4]).querySelectorAll("button.tw-form-tag"));

        const rerunQuery = '[aria-label="Let viewers know your stream was previously recorded. Failure to label Reruns leads to viewer confusion which damages trust"]';
        const brandedQuery = '[aria-label="Let viewers know if your stream features branded content. This includes paid product placement, endorsement, or other commercial relationships. To learn more, view our Help Center Article and our Terms of Service."]';
        dataInput("rerun", document.querySelector(rerunQuery), "Rerun");
        dataInput("branded", document.querySelector(brandedQuery), "Branded Content");
        
        dataInput("btnClassification", document.querySelector("button.tw-select-button"), "Classification Button");
        let classifications = {};
        for (let i = 2; i < checkboxNames.length; i++) {
            classifications[checkboxNames[i]] = (state) => parseClassifications(i, state);
        }
        dataInput("classifications", classifications);

        dataInput("language", document.querySelector("select"), "Stream Language");

        return (window.el);
    }

    window.init = init;
})();
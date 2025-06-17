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
    window.currentPresets = null;
    window.el = {
        title: '',
        notifications: '',
        tagSelector: '',
        currentTags: [],
        language: '',
        btnClassification: '',
        classifications: [],
        rerun: '',
        branded: '',
    }

    const checkboxNames = ['Rerun', 'Branded', "Politics", "Drugs", "Gambling", "Mature", "Profanity", "Sexual", "Violence"];

    const initObserver = new MutationObserver(() => {
        if (document.getElementById("Tags-Selector")) {
            initObserver.disconnect(); // Stop observing once found
            init();
            window.currentPresets = JSON.parse(localStorage.getItem("StreamInfoSaver-Data")) || "notfound";
            console.log("✅ Twitch Stream Manager initialized successfully.");
        }
    });
    initObserver.observe(document.body, {
        childList: true,
        subtree: true,
    });

    // Preset Handling
    async function setPresetData(presetIndex){
        if (!window.currentPresets){
            console.log(`❌ No preset data found. Please save a preset first.`);
            return false;
        }
        const preset = window.currentPresets[presetIndex];
        const info = preset.info;
        if (!preset) {
            console.log(`❌ Preset at index ${presetIndex} does not exist.`);
            return false;
        }

        window.el.classifications.Politics(info.contentClassification.politics);
        window.el.classifications.Drugs(info.contentClassification.drugs);
        window.el.classifications.Gambling(info.contentClassification.gambling);
        // window.el.classifications.Mature(info.contentClassification.mature); // Mature is set by category
        window.el.classifications.Profanity(info.contentClassification.profanity);
        window.el.classifications.Sexual(info.contentClassification.sexual);
        window.el.classifications.Violence(info.contentClassification.violence);
        
        ChangeTextbox(window.el.title, info.title);
        ChangeTextbox(window.el.notifications, info.notification);
        ChangeCategory(info.category);
        await deleteAllTags();
        await addManyTags(info.tags);
        // info.tags.forEach((tag) => {
        //     if (tag && tag.trim() !== "") {
        //         addTag(tag);
        //     }
        // });
        ChangeLanguage(info.language);

        toggleCheckboxes(window.el.rerun, info.rerun);
        toggleCheckboxes(window.el.branded, info.branded);

        console.log(`✅ Preset ${presetIndex} (${preset.name}) applied successfully.`);
        return true;
    }
    window.setPresetData = setPresetData;

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
    window.ChangeTextbox = ChangeTextbox;

    // Tags 
    
    async function deleteAllTags() {
        dataInput("currentTags", getAllTags());

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
    function addTag(text) {
        const input = window.el.tagSelector;
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
    async function addManyTags(tagsArray) {
        tagsArray.forEach(async (tag) => {            
            addTag(tag);
            
            await new Promise((resolve) => {
                const observer = new MutationObserver(() => {
                    const currentTags = getAllTags();
                    if (!currentTags || currentTags.length == 0) return;                    
                    if (currentTags[currentTags.length-1].textContent == tag) {
                        observer.disconnect(); // Stop observing once found
                        resolve();
                    }
                });
                observer.observe(document.body, {
                    childList: true,
                    subtree: true,
                });
            });

        });
        window.el.currentTags = getAllTags();
        return true;
    }
    
    window.addTag = addTag;
    window.addManyTags = addManyTags;
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
    function ChangeCategory(text) {
        const selector = window.el.categorySelector;
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
    function ChangeLanguage(value) {
        const element = window.el.language;
        try {
            // Use native input value setter to bypass React's value control
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                window.HTMLSelectElement.prototype, 
                'value'
            ).set;
            
            nativeInputValueSetter.call(element, value);
    
            // Create and dispatch React-compatible input event
            const inputEvent = new Event('input', { bubbles: true });
            Object.defineProperty(inputEvent, 'target', { 
                writable: false, 
                value: element 
            });
            element.dispatchEvent(inputEvent);
    
            // Create and dispatch React-compatible change event
            const changeEvent = new Event('change', { bubbles: true });
            Object.defineProperty(changeEvent, 'target', { 
                writable: false, 
                value: element 
            });
            element.dispatchEvent(changeEvent);
    
            console.log(`✅ ${element.dataset.saverName} (${element.id}) changed to: "${value}"`);
            return true;
            
        } catch (error) {
            console.error(`❌ Error updating ${element.dataset.saverName} (${element.id}):`, error);
            return false;
        }
    }
    window.ChangeLanguage = ChangeLanguage;
    
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
    window.selectGroupFromLabel = selectGroupFromLabel;

    function getAllTags() {
        return selectGroupFromLabel(document.querySelectorAll("label")[4]).querySelectorAll("button.tw-form-tag");
    }
    window.getAllTags = getAllTags;

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
        dataInput("currentTags", getAllTags());

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
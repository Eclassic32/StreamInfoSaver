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
    function deleteAllTags() { // FIX: finish this function
        let tags = window.el.currentTags; 
        let counter = 0;
        
        setInterval(() => {
            if (counter >= tags.length) {
                console.log("✅ All tags deleted");
                clearInterval(this);
                return true;
            }
            const tag = tags[counter];
            console.log(`Deleting tag(${counter}): `, tags);
            tag.remove();
            counter++;
        }, 3000);

        // tags.forEach(tag => {
        //     const name = tag.textContent;

        //     // window.HTMLButtonElement.prototype.click.call(tag);
        //     // console.log(`✅ Deleted tag: ${name}`);
            
        //     setTimeout(() => {
        //         console.log(`Deleting tag: `, tags);
        //         tag.click();
        //         console.log(`✅ Deleted tag: ${name}`);
        //     }, 5000);
        // });
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

    // Stream Language

    // Content Classification







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

    function init() {
        const path = (window.location.pathname).split("/")
        const allLablels = document.querySelectorAll("label");

        dataInput("title", document.querySelector(`#edit-broadcast-title-formgroup`), "Title");
        dataInput("notifications", document.querySelector(`[placeholder="${path[3]} went live!"]`), "Notifications");
        
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



        return (window.el);
    }

    window.init = init;

    
})();
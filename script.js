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
    window.el = {
        title: '',
        notifications: '',
        category: '',
        tagSelector: '',
        tags: [],
        language: '',
        classification: [],
        rerun: '',
        branded: ''
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
        let tags = window.el.tags; 
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
        if (checkbox.checked !== state) {
            checkbox.click();
            console.log(`✅ ${checkbox.dataset.saverName} (${checkbox.id}) set to: ${state}`);
            return true;
        } else {
            console.log(`❌ ${checkbox.dataset.saverName} (${checkbox.id}) is already set to: ${state}`);
            return false;
        }

    }

    window.toggleCheckboxes = toggleCheckboxes

    // Category

    // Stream Language

    // Content Classification







    // Initialization
    function selectGroupFromLabel(label){
        return label.parentElement.parentElement.parentElement;
    }

    function init() {
        const path = (window.location.pathname).split("/")
        const allLablels = document.querySelectorAll("label");

        window.el.title = document.querySelector(`#edit-broadcast-title-formgroup`);
        window.el.title.dataset.saverName = "Title";
        window.el.notifications = document.querySelector(`[placeholder="${path[3]} went live!"]`);
        window.el.notifications.dataset.saverName = "Notifications";
        
        window.el.tagSelector = document.getElementById("Tags-Selector");
        window.el.tagSelector.dataset.saverName = "Tag Selector";

        window.el.tags = selectGroupFromLabel(allLablels[4]).querySelectorAll("button.tw-form-tag");
        window.el.classification = selectGroupFromLabel(allLablels[7]).querySelectorAll("button.tw-form-tag");

        window.el.rerun = document.querySelector('[aria-label="Let viewers know your stream was previously recorded. Failure to label Reruns leads to viewer confusion which damages trust"]');
        window.el.rerun.dataset.saverName = "Rerun";
        window.el.branded = document.querySelector('[aria-label="Let viewers know if your stream features branded content. This includes paid product placement, endorsement, or other commercial relationships. To learn more, view our Help Center Article and our Terms of Service."]');
        window.el.branded.dataset.saverName = "Branded Content";

        return (window.el);
    }

    window.init = init;
})();
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
        tags: '',
        language: '',
        classification: '',
        rerun: '',
        branded: ''
    }

    // Initialize
    function ChangeTextbox(textarea, text) {
        const reactKey = Object.keys(textarea).find(key => key.startsWith('__react'));
        if (!reactKey) {
            console.error('❌ React instance not found');
            return false;
        }
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
    // Expose to global scope for console access
    window.changeTextbox = function(textbox, text) {
        init();

        if (typeof text !== 'string') {
            console.error('❌ Please provide a string. Usage: changeTextbox(el.element, "Your text here")');
            return false;
        }   

        return ChangeTextbox(textbox, text);
    };

    function init() {
        const path = (window.location.pathname).split("/")

        window.el.title = document.querySelector(`#edit-broadcast-title-formgroup`);
        window.el.title.dataset.saverName = "Title";
        window.el.notifications = document.querySelector(`[placeholder="${path[3]} went live!"]`);
        window.el.notifications.dataset.saverName = "Notifications";
        
    }

    window.init = init;
})();
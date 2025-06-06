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
        title: 'edit-broadcast-title-formgroup',
        notifications: '',
        category: '',
        tags: '',
        language: '',
        classification: '',
        rerun: '',
        branded: ''
    }

    // Initialize
    function ChangeTextbox(elementId, text) {
        const textarea = document.getElementById(elementId);
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
            console.log(`✅ ${elementId} changed to: "${text}"`);
            
            return true;
            
        } catch (error) {
            console.error(`❌ Error updating ${elementId}:`, error);
            return false;
        }
    }

    function getNotificationID() {
        const notificationElement = document.querySelector('[placeholder="eclasx32 went live!"]');
        if (!notificationElement) {
            console.error('❌ Notification element not found');
            return null;
        }
        return notificationElement.id;
    } 

    window.getNotificationID = getNotificationID;

    // Expose to global scope for console access
    window.changeTextbox = function(elementId, text) {
        init();
        
        if (typeof text !== 'string') {
            console.error('❌ Please provide a string. Usage: changeTextbox(elementIDs.element, "Your text here")');
            return false;
        }   

        return ChangeTextbox(elementId, text);
    };

    function init() {
        window.el.notifications = getNotificationID();
    }
})();
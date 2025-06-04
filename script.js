// ==UserScript==
// @name         Textarea Console Command
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Exposes changeTitle() command to console for React textarea
// @author       You
// @match        *://*/*
// @grant        none
// ==/UserScript==
(function() {
    'use strict';
    // React-specific method that worked
    function reactChangeTitle(text) {
        const textarea = document.getElementById('edit-broadcast-title-formgroup');
        if (!textarea) {
            console.error('❌ Textarea not found');
            return false;
        }
        console.log(`🔄 Setting textarea to: "${text}"`);
        
        // Find React fiber
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
            
            console.log('✅ Textarea updated successfully');
            return true;
            
        } catch (error) {
            console.error('❌ Error updating textarea:', error);
            return false;
        }
    }
    // Expose to global scope for console access
    window.changeTitle = function(text) {
        if (typeof text !== 'string') {
            console.error('❌ Please provide a string. Usage: changeTitle("Your text here")');
            return false;
        }
        
        return reactChangeTitle(text);
    };
    // Initialize message
    console.log('📝 Textarea Console Command Ready!');
    console.log('Usage: changeTitle("Your custom title here")');
    console.log('Example: changeTitle("My Custom Broadcast Title")');
})();
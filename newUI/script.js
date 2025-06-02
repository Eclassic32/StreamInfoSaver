// Global state
let selectedTags = [];
let selectedClassifications = [];
let currentCategoryIndex = -1;
let currentTagIndex = -1;
let configs = [];
let tagSuggestions = [];
let mainEl = {};

const classificationCheckboxes = [
        'politics', 'drugs', 'gambling', 'mature', 'profanity', 'sexual', 'violence'
];

// Content classification labels
const classificationLabels = {
    politics: "Politics",
    drugs: "Drugs/Intoxication", 
    gambling: "Gambling",
    mature: "Mature Game",
    profanity: "Profanity",
    sexual: "Sexual Themes",
    violence: "Violence"
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeCharacterCounters();
    initializeCategorySearch();
    initializeTagsInput();
    initializeContentClassification();
    initializeKeyboardNavigation();
    initializeConfigSearch();
    
    mainEl = {
        title: document.getElementById('stream-title'),
        notification: document.getElementById('go-live-notification'),
        category: document.getElementById('category-search'),
        rerun: document.getElementById('rerun-checkbox'),
        brandedContent: document.getElementById('branded-content-checkbox'),
        language: document.getElementById('stream-language'),
        classificationCheckboxes: {}
    };

    classificationCheckboxes.forEach(classification => {
        mainEl.classificationCheckboxes[classification] = document.getElementById(`content-classification-${classification}`);
        if (mainEl.classificationCheckboxes[classification].checked) {
            window.addClassificationTag(classification);
        }
    });

});

// Character counter functionality
function initializeCharacterCounters() {
    const titleInput = document.getElementById('stream-title');
    const titleCounter = document.getElementById('title-counter');
    const notificationInput = document.getElementById('go-live-notification');
    const notificationCounter = document.getElementById('notification-counter');

    function updateCounter(input, counter, maxLength) {
        const currentLength = input.value.length;
        counter.textContent = `${currentLength}/${maxLength}`;
    }

    // Title counter
    titleInput.addEventListener('input', function() {
        updateCounter(titleInput, titleCounter, 140);
    });

    // Notification counter  
    notificationInput.addEventListener('input', function() {
        updateCounter(notificationInput, notificationCounter, 140);
    });

    // Initialize counters
    updateCounter(titleInput, titleCounter, 140);
    updateCounter(notificationInput, notificationCounter, 140);
}

// Category search functionality
function initializeCategorySearch() {
    const categoryInput = document.getElementById('category-search');
    const categoryDropdown = document.getElementById('category-dropdown');
    const active = {
        parent: document.getElementById('active-category'),
        image: document.querySelector('#active-category img.category-image'),
        title: document.querySelector('#active-category .category-title'),
        numbers: document.querySelector('#active-category .category-numbers'),
        tags: document.querySelector('#active-category #category-tags'),
        closeBTN: document.querySelector('#active-category .close-button')
    };

    categoryInput.addEventListener('focus', function() {
        showCategoryDropdown('');
    });

    categoryInput.addEventListener('input', function() {
        const query = this.value.toLowerCase();
        showCategoryDropdown(query);
    });

    categoryInput.addEventListener('blur', function(e) {
        // Delay hiding to allow click on dropdown items
        setTimeout(() => {
            if (!categoryDropdown.contains(document.activeElement)) {
                hideCategoryDropdown();
            }
        }, 150);
    });

    active.closeBTN.addEventListener('click', function() {
        categoryInput.classList.remove('hidden');
        active.parent.classList.add('hidden');
        categoryInput.value = '';
        hideCategoryDropdown();
    });

    function showCategoryDropdown(query) {
        configs = twitchCategories.filter(category => 
            category.title.toLowerCase().includes(query)
        );

        if (configs.length === 0) {
            hideCategoryDropdown();
            return;
        }

        categoryDropdown.innerHTML = '';
        configs.forEach((category, index) => {
            const item = createCategoryDropdownItem(category, index);
            categoryDropdown.appendChild(item);
        });

        categoryDropdown.style.display = 'block';
        currentCategoryIndex = -1;
    }

    function hideCategoryDropdown() {
        categoryDropdown.style.display = 'none';
        currentCategoryIndex = -1;
    }

    function createCategoryDropdownItem(category, index) {
        const item = document.createElement('div');
        item.className = 'dropdown-item';
        item.dataset.index = index;

        const viewersText = category.viewers ? `${category.viewers} Viewers` : '';
        const followersText = category.followers ? `${category.followers} Followers` : '';
        const statsText = [viewersText, followersText].filter(text => text).join(' • ');

        item.innerHTML = `
            <img src="${category.image}" alt="${category.title}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjNDY0NjQ5Ii8+Cjwvc3ZnPgo='">
            <div class="dropdown-item-content">
                <div class="dropdown-item-title">${category.title}</div>
                ${statsText ? `<div class="dropdown-item-stats">${statsText}</div>` : ''}
            </div>
        `;

        item.addEventListener('click', function() {
            // Set the current index and call selectCategory to trigger the full selection logic
            currentCategoryIndex = index;
            window.selectCategory();
        });

        return item;
    }

    // Expose functions for keyboard navigation
    window.navigateCategories = function(direction) {
        if (categoryDropdown.style.display === 'none') return;

        const items = categoryDropdown.querySelectorAll('.dropdown-item');
        if (items.length === 0) return;

        // Remove previous highlight
        if (currentCategoryIndex >= 0) {
            items[currentCategoryIndex].classList.remove('highlighted');
        }

        // Update index
        if (direction === 'down') {
            currentCategoryIndex = (currentCategoryIndex + 1) % items.length;
        } else {
            currentCategoryIndex = currentCategoryIndex <= 0 ? items.length - 1 : currentCategoryIndex - 1;
        }

        // Add new highlight
        items[currentCategoryIndex].classList.add('highlighted');
        items[currentCategoryIndex].scrollIntoView({ block: 'nearest' });
    };

    window.selectCategory = function(id = null) {
        if ((currentCategoryIndex >= 0 && configs[currentCategoryIndex]) || id !== null){
            // Set active category
            const category = (id !== null) ? twitchCategories.find(cat => cat.id === id) : configs[currentCategoryIndex];
            console.log(id, category);
            if (!category) return;

            categoryInput.classList.add('hidden');
            active.image.src = category.image;
            active.title.textContent = category.title;

            active.numbers.innerHTML = writeCategoryNumbers(category.viewers, category.followers);
            
            active.tags.innerHTML = '';
            category.tags.forEach(tag => {
                const tagElement = document.createElement('div');
                tagElement.className = 'tag';
                tagElement.textContent = tag;
                active.tags.appendChild(tagElement);
            });
            active.parent.classList.remove('hidden');

            categoryInput.value = category.title;
            hideCategoryDropdown();
        }
    };

    function writeCategoryNumbers(viewers, followers) {
        let output = '';

        if (viewers) {
            output += `<span class="viewer-count"><span>${viewers}</span> Viewers</span>`;
        }

        if (viewers && followers) {
            output += '<span class="dot"> • </span>';
        } 
        if (followers) {
            output += `<span class="follower-count"><span>${followers}</span> Followers</span>`;
        }

        return output;
    }
}

// Tags input functionality
function initializeTagsInput() {
    const tagsInput = document.getElementById('tags-input');
    const tagsDropdown = document.getElementById('tags-dropdown');
    const addTagBtn = document.getElementById('add-tag-btn');
    const selectedTagsContainer = document.getElementById('selected-tags');

    tagsInput.addEventListener('input', function() {
        const query = this.value.toLowerCase();
        showTagSuggestions(query);
    });

    tagsInput.addEventListener('focus', function() {
        const query = this.value.toLowerCase();
        showTagSuggestions(query);
    });

    tagsInput.addEventListener('blur', function(e) {
        setTimeout(() => {
            if (!tagsDropdown.contains(document.activeElement)) {
                hideTagSuggestions();
            }
        }, 150);
    });

    addTagBtn.addEventListener('click', function() {
        addTag(tagsInput.value.trim());
    });

    tagsInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            addTag(this.value.trim());
        }
    });

    function showTagSuggestions(query) {
        if (!query) {
            hideTagSuggestions();
            return;
        }

        tagSuggestions = twitchTagSuggestions.filter(tag => 
            tag.toLowerCase().includes(query) && !selectedTags.includes(tag)
        );

        if (tagSuggestions.length === 0) {
            hideTagSuggestions();
            return;
        }

        tagsDropdown.innerHTML = '';
        tagSuggestions.forEach((tag, index) => {
            const item = createTagDropdownItem(tag, index);
            tagsDropdown.appendChild(item);
        });

        tagsDropdown.style.display = 'block';
        currentTagIndex = -1;
    }

    function hideTagSuggestions() {
        tagsDropdown.style.display = 'none';
        currentTagIndex = -1;
    }

    function createTagDropdownItem(tag, index) {
        const item = document.createElement('div');
        item.className = 'tag-dropdown-item';
        item.dataset.index = index;
        item.textContent = tag;

        item.addEventListener('click', function() {
            addTag(tag);
        });

        return item;
    }

    function addTag(tagName) {
        if (!tagName || selectedTags.includes(tagName)) return;

        selectedTags.push(tagName);
        tagsInput.value = '';
        hideTagSuggestions();
        renderSelectedTags();
    }

    function removeTag(tagName) {
        selectedTags = selectedTags.filter(tag => tag !== tagName);
        renderSelectedTags();
    }

    function renderSelectedTags() {
        selectedTagsContainer.innerHTML = '';
        selectedTags.forEach(tag => {
            const tagElement = document.createElement('div');
            tagElement.className = 'tag';
            tagElement.innerHTML = `
                <span class="tag-text">${tag}</span>
                <button type="button" class="tag-remove" onclick="removeTag('${tag}')">&times;</button>
            `;
            selectedTagsContainer.appendChild(tagElement);
        });
    }

    // Expose functions globally
    window.removeTag = removeTag;
    window.addTag = addTag;


    window.navigateTags = function(direction) {
        if (tagsDropdown.style.display === 'none') return;

        const items = tagsDropdown.querySelectorAll('.tag-dropdown-item');
        if (items.length === 0) return;

        // Remove previous highlight
        if (currentTagIndex >= 0) {
            items[currentTagIndex].classList.remove('highlighted');
        }

        // Update index
        if (direction === 'down') {
            currentTagIndex = (currentTagIndex + 1) % items.length;
        } else {
            currentTagIndex = currentTagIndex <= 0 ? items.length - 1 : currentTagIndex - 1;
        }

        // Add new highlight
        items[currentTagIndex].classList.add('highlighted');
        items[currentTagIndex].scrollIntoView({ block: 'nearest' });
    };

    window.selectTag = function() {
        if (currentTagIndex >= 0 && tagSuggestions[currentTagIndex]) {
            addTag(tagSuggestions[currentTagIndex]);
        }
    };
}

// Content classification functionality
function initializeContentClassification() {
    const expandBtn = document.getElementById('classification-expand');
    const classificationContent = document.getElementById('classification-content');
    const classificationTags = document.getElementById('classification-tags');

    expandBtn.addEventListener('click', function() {
        const isExpanded = classificationContent.style.display !== 'none';
        
        if (isExpanded) {
            classificationContent.style.display = 'none';
            expandBtn.classList.remove('expanded');
        } else {
            classificationContent.style.display = 'block';
            expandBtn.classList.add('expanded');
        }
    });

    classificationCheckboxes.forEach(classification => {
        const checkbox = document.getElementById(`content-classification-${classification}`);
        if (checkbox) {
            checkbox.addEventListener('change', function() {
                if (this.checked) {
                    addClassificationTag(classification);
                } else {
                    removeClassificationTag(classification);
                }
            });
        }
    });

    function addClassificationTag(classification) {
        if (!selectedClassifications.includes(classification)) {
            selectedClassifications.push(classification);
            renderClassificationTags();
        }
    }

    function removeClassificationTag(classification) {
        selectedClassifications = selectedClassifications.filter(c => c !== classification);
        
        // Uncheck the corresponding checkbox
        const checkbox = document.getElementById(`content-classification-${classification}`);
        if (checkbox) {
            checkbox.checked = false;
        }
        
        renderClassificationTags();
    }

    function renderClassificationTags() {
        classificationTags.innerHTML = '';
        selectedClassifications.forEach(classification => {
            const tagElement = document.createElement('div');
            tagElement.className = 'tag';
            tagElement.innerHTML = `
                <span class="tag-text">${classificationLabels[classification]}</span>
                <button type="button" class="tag-remove" onclick="removeClassificationTag('${classification}')">&times;</button>
            `;
            classificationTags.appendChild(tagElement);
        });
    }

    // Expose function globally
    window.addClassificationTag = addClassificationTag;
    window.removeClassificationTag = removeClassificationTag;
}

// Keyboard navigation
function initializeKeyboardNavigation() {
    const configsInput = document.getElementById('configs-search');
    const categoryInput = document.getElementById('category-search');
    const tagsInput = document.getElementById('tags-input');

    configsInput.addEventListener('keydown', function(e) {
        switch(e.key) {
            case 'ArrowDown':
                e.preventDefault();
                if (document.getElementById('configs-dropdown').style.display !== 'none') {
                    window.navigateConfigs('down');
                }
                break;
            case 'ArrowUp':
                e.preventDefault();
                if (document.getElementById('configs-dropdown').style.display !== 'none') {
                    window.navigateConfigs('up');
                }
                break;
            case 'Enter':
                e.preventDefault();
                if (document.getElementById('configs-dropdown').style.display !== 'none') {
                    window.selectConfig();
                }
                break;
            case 'Escape':
                document.getElementById('configs-dropdown').style.display = 'none';
                currentCategoryIndex = -1;
                break;
        }
    });

    categoryInput.addEventListener('keydown', function(e) {
        switch(e.key) {
            case 'ArrowDown':
                e.preventDefault();
                if (document.getElementById('category-dropdown').style.display !== 'none') {
                    window.navigateCategories('down');
                }
                break;
            case 'ArrowUp':
                e.preventDefault();
                if (document.getElementById('category-dropdown').style.display !== 'none') {
                    window.navigateCategories('up');
                }
                break;
            case 'Enter':
                e.preventDefault();
                if (document.getElementById('category-dropdown').style.display !== 'none') {
                    window.selectCategory();
                }
                break;
            case 'Escape':
                document.getElementById('category-dropdown').style.display = 'none';
                currentCategoryIndex = -1;
                break;
        }
    });

    tagsInput.addEventListener('keydown', function(e) {
        switch(e.key) {
            case 'ArrowDown':
                e.preventDefault();
                if (document.getElementById('tags-dropdown').style.display !== 'none') {
                    window.navigateTags('down');
                }
                break;
            case 'ArrowUp':
                e.preventDefault();
                if (document.getElementById('tags-dropdown').style.display !== 'none') {
                    window.navigateTags('up');
                }
                break;
            case 'Enter':
                e.preventDefault();
                if (document.getElementById('tags-dropdown').style.display !== 'none' && currentTagIndex >= 0) {
                    window.selectTag();
                } else {
                    const tagValue = this.value.trim();
                    if (tagValue) {
                        selectedTags.push(tagValue);
                        this.value = '';
                        document.getElementById('tags-dropdown').style.display = 'none';
                        document.getElementById('selected-tags').innerHTML = '';
                        selectedTags.forEach(tag => {
                            const tagElement = document.createElement('div');
                            tagElement.className = 'tag';
                            tagElement.innerHTML = `
                                <span class="tag-text">${tag}</span>
                                <button type="button" class="tag-remove" onclick="removeTag('${tag}')">&times;</button>
                            `;
                            document.getElementById('selected-tags').appendChild(tagElement);
                        });
                    }
                }
                break;
            case 'Escape':
                document.getElementById('tags-dropdown').style.display = 'none';
                currentTagIndex = -1;
                break;
        }
    });
}

// Handle clicks outside dropdowns
document.addEventListener('click', function(e) {
    const categoryDropdown = document.getElementById('category-dropdown');
    const categoryInput = document.getElementById('category-search');
    const tagsDropdown = document.getElementById('tags-dropdown');
    const tagsInput = document.getElementById('tags-input');

    if (!categoryDropdown.contains(e.target) && e.target !== categoryInput) {
        categoryDropdown.style.display = 'none';
        currentCategoryIndex = -1;
    }

    if (!tagsDropdown.contains(e.target) && e.target !== tagsInput) {
        tagsDropdown.style.display = 'none';
        currentTagIndex = -1;
    }
});

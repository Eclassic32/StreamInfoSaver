let savedConfigs = {};

main();

async function main() {

    const exampleStr = await fetchFileData("./example.json");
    savedConfigs = JSON.parse(exampleStr);

    console.log(savedConfigs);
}

async function fetchFileData(params) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', params, true);
        xhr.responseType = 'text';
        
        xhr.onload = function() {
        if (xhr.status >= 200 && xhr.status < 300) {
            resolve(xhr.response);
        } else {
            reject(new Error(`Failed to fetch file: ${xhr.statusText}`));
        }
        };
        
        xhr.onerror = function() {
        reject(new Error('Network error'));
        };
        
        xhr.send();
    });
}

// Config search functionality
function initializeConfigSearch() {
    const configsInput = document.getElementById('configs-search');
    const configsDropdown = document.getElementById('configs-dropdown');
    const active = {
        parent: document.getElementById('active-configs'),
        title: document.querySelector('#active-configs .configs-title'),
        description: document.querySelector('#active-configs .configs-description'),
        closeBTN: document.querySelector('#active-configs .close-button')
    };

    configsInput.addEventListener('focus', function() {
        showConfigDropdown('');
    });

    configsInput.addEventListener('input', function() {
        const query = this.value.toLowerCase();
        showConfigDropdown(query);
    });

    configsInput.addEventListener('blur', function(e) {
        // Delay hiding to allow click on dropdown items
        setTimeout(() => {
            if (!configsDropdown.contains(document.activeElement)) {
                hideConfigDropdown();
            }
        }, 150);
    });

    active.closeBTN.addEventListener('click', function() {
        configsInput.classList.remove('hidden');
        active.parent.classList.add('hidden');
        configsInput.value = '';
        hideConfigDropdown();
    });

    function showConfigDropdown(query) {
        configs = savedConfigs.filter(config => 
            config.name.toLowerCase().includes(query)
        );

        if (configs.length === 0) {
            hideConfigDropdown();
            return;
        }

        configsDropdown.innerHTML = '';
        configs.forEach((config, index) => {
            const item = createConfigDropdownItem(config, index);
            configsDropdown.appendChild(item);
        });

        configsDropdown.style.display = 'block';
        currentConfigIndex = -1;
    }

    function hideConfigDropdown() {
        configsDropdown.style.display = 'none';
        currentConfigIndex = -1;
    }

    function createConfigDropdownItem(config, index) {
        const item = document.createElement('div');
        item.className = 'dropdown-item';
        item.dataset.index = index;
        const description = config.description;

        item.innerHTML = `
            <div class="dropdown-item-content">
                <div class="dropdown-item-title">${config.name}</div>
                ${description ? `<div class="dropdown-item-stats">${description}</div>` : ''}
            </div>
        `;

        item.addEventListener('click', function() {
            // Set the current index and call selectConfig to trigger the full selection logic
            currentConfigIndex = index;
            window.selectConfig();
        });

        return item;
    }

    // Expose functions for keyboard navigation
    window.navigateConfigs = function(direction) {
        if (configsDropdown.style.display === 'none') return;

        const items = configsDropdown.querySelectorAll('.dropdown-item');
        if (items.length === 0) return;

        // Remove previous highlight
        if (currentConfigIndex >= 0) {
            items[currentConfigIndex].classList.remove('highlighted');
        }

        // Update index
        if (direction === 'down') {
            currentConfigIndex = (currentConfigIndex + 1) % items.length;
        } else {
            currentConfigIndex = currentConfigIndex <= 0 ? items.length - 1 : currentConfigIndex - 1;
        }

        // Add new highlight
        items[currentConfigIndex].classList.add('highlighted');
        items[currentConfigIndex].scrollIntoView({ block: 'nearest' });
    };

    window.selectConfig = function() {
        if (currentConfigIndex >= 0 && configs[currentConfigIndex]) {
            // Set active configs
            const config = configs[currentConfigIndex];

            configsInput.classList.add('hidden');
            configsInput.value = config.name;
            active.title.textContent = config.name;
            active.description.innerHTML = config.description || '';
            
            importDataFromConfig(config);
            
            active.parent.classList.remove('hidden');
            hideConfigDropdown();
        }
    };

    function importDataFromConfig(config) {
        console.log('Importing data from config:', config);
        const info = config.info || {};
        // fix this later

        mainEl.title.value = info.title || mainEl.title.placeholder;
        mainEl.description.value = info.description || mainEl.description.placeholder;
        mainEl.tags.value = info.tags ? info.tags.join(', ') : '';
        mainEl.category.value = info.category || mainEl.category.placeholder;
    }
}
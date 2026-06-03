/**
 * Scripture Reference Engine - Navigation Module
 */

let currentNavIndex = 0;
let maxItemsCount = 0;
let onIndexChangeCallback = () => {};

/**
 * Initializes navigation event hooks and sets up boundaries
 */
export function setupNavigation({ btnPrevId, btnNextId }, onIndexChange) {
    const prevBtn = document.getElementById(btnPrevId);
    const nextBtn = document.getElementById(btnNextId);
    onIndexChangeCallback = onIndexChange;

    prevBtn.addEventListener('click', () => {
        if (currentNavIndex > 0) {
            currentNavIndex--;
            // Clear search field so navigation mode takes visual control cleanly
            const searchBar = document.getElementById('searchBar');
            if (searchBar) searchBar.value = "";
            onIndexChangeCallback(currentNavIndex);
        }
    });

    nextBtn.addEventListener('click', () => {
        if (currentNavIndex < maxItemsCount - 1) {
            currentNavIndex++;
            // Clear search field so navigation mode takes visual control cleanly
            const searchBar = document.getElementById('searchBar');
            if (searchBar) searchBar.value = "";
            onIndexChangeCallback(currentNavIndex);
        }
    });
}

/**
 * Syncs the maximum size of the dictionary database records
 */
export function setNavigationTotal(totalCount) {
    maxItemsCount = totalCount;
}

/**
 * Gets the currently tracked navigation index pointer
 */
export function getCurrentIndex() {
    return currentNavIndex;
}

/**
 * Sets the navigation index pointer explicitly (e.g. following a search match)
 */
export function setCurrentIndex(index) {
    if (index >= 0 && index < maxItemsCount) {
        currentNavIndex = index;
    }
}

/**
 * Standard utility to safely handle disabling/enabling buttons
 */
export function updateNavigationButtonsState() {
    const prevBtn = document.getElementById('btnPrev');
    const nextBtn = document.getElementById('btnNext');

    if (!prevBtn || !nextBtn) return;

    prevBtn.disabled = currentNavIndex === 0;
    nextBtn.disabled = currentNavIndex >= maxItemsCount - 1;
}
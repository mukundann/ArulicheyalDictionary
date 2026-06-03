/**
 * Scripture Reference Engine - Core Controller Orchestrator (Synchronized Search & Navigation)
 */

import { expandRange, normalizeQueryIndex, buildDatabase } from './parser.js';
import { displayItems, showError, changeFontScale } from './ui.js';
import { 
    setupNavigation, 
    setNavigationTotal, 
    getCurrentIndex, 
    setCurrentIndex, // Added capability to update index from search
    updateNavigationButtonsState 
} from './navigation.js';

let appConfig = null;
let dictionaryDatabase = [];

document.addEventListener("DOMContentLoaded", () => {
    initializeSystem();
    
    // Core search input query hook
    document.getElementById('searchBar').addEventListener('input', () => {
        filterDictionary();
    });

    // Font Scaling Hooks
    document.getElementById('btnFontDecrease').addEventListener('click', () => {
        changeFontScale(-1);
        filterDictionary();
    });
    document.getElementById('btnFontReset').addEventListener('click', () => {
        changeFontScale(0);
        filterDictionary();
    });
    document.getElementById('btnFontIncrease').addEventListener('click', () => {
        changeFontScale(1);
        filterDictionary();
    });

    // Inject navigation components and bind programmatic callback
    setupNavigation({ btnPrevId: 'btnPrev', btnNextId: 'btnNext' }, () => {
        filterDictionary();
    });
});

async function initializeSystem() {
    try {
        const configResponse = await fetch('config.json');
        if (!configResponse.ok) throw new Error('config.json missing');
        appConfig = await configResponse.json();

        document.getElementById('appTitle').innerText = appConfig.appTitle || "Scripture Dictionary";
        document.getElementById('appSubtitle').innerText = appConfig.appSubtitle || "Pasuram Guide";

        const rangeMapping = appConfig.chapterRangeMapping || {};
        const rangeKeys = Object.keys(rangeMapping);
        if (rangeKeys.length === 0) throw new Error('No configurations found inside chapterRangeMapping.');

        const uniqueFilesMap = new Map();
        rangeKeys.forEach(key => {
            const filePath = rangeMapping[key].replace('.json', '.csv');
            const chaps = expandRange(key);
            if (!uniqueFilesMap.has(filePath)) {
                uniqueFilesMap.set(filePath, []);
            }
            uniqueFilesMap.set(filePath, uniqueFilesMap.get(filePath).concat(chaps));
        });

        const fetchPromises = Array.from(uniqueFilesMap.keys()).map(async (filePath) => {
            const response = await fetch(filePath);
            if (!response.ok) throw new Error(`Could not locate target file: ${filePath}`);
            const rawText = await response.text();
            const allowedChapters = uniqueFilesMap.get(filePath);
            return { filePath, rawText, allowedChapters };
        });

        const loadedFiles = await Promise.all(fetchPromises);
        dictionaryDatabase = buildDatabase(loadedFiles);

        if (dictionaryDatabase.length > 0) {
            document.getElementById('searchBar').disabled = false;
            
            // Connect internal database limits into the separate navigation module
            setNavigationTotal(dictionaryDatabase.length);
            
            // Instantly render initial view state
            filterDictionary();
        } else {
            showError("No valid records found matching configuration targets.");
        }

    } catch (error) {
        console.error(error);
        showError(error.message);
    }
}

function filterDictionary() {
    const rawQuery = document.getElementById('searchBar').value.toLowerCase().trim();
    const isSearching = rawQuery !== "";

    // SCENARIO A: Walkthrough Navigation Mode (Search bar is clean and blank)
    if (!isSearching) {
        updateNavigationButtonsState(false);
        const activeIdx = getCurrentIndex();
        const targetedItem = dictionaryDatabase[activeIdx];
        displayItems(targetedItem ? [targetedItem] : []);
        return;
    }

    // SCENARIO B: Multi-Row Result Query Mapping Filter Mode
    const normalizedQuery = normalizeQueryIndex(rawQuery);

    const filtered = dictionaryDatabase.filter(item => {
        const matchesNormalizedIndex = item.pasuramId.toLowerCase().includes(normalizedQuery);
        const matchesTextContent = item.pasuramId.toLowerCase().includes(rawQuery) || 
                                   item.fullVerseText.toLowerCase().includes(rawQuery);
        const matchesTokens = item.wordTokens.some(tok => 
            tok[0].toLowerCase().includes(rawQuery) || tok[1].toLowerCase().includes(rawQuery)
        );

        return matchesNormalizedIndex || matchesTextContent || matchesTokens;
    });

    filtered.sort((a, b) => a.globalOrderIndex - b.globalOrderIndex);

    // CRUCIAL FIX: If the search matches exactly or finds relevant verses, 
    // align the tracking navigation index to the first found result.
    if (filtered.length > 0) {
        // Find the absolute original index position of this item inside the main database
        const originalDbIndex = dictionaryDatabase.findIndex(item => item.pasuramId === filtered[0].pasuramId);
        if (originalDbIndex !== -1) {
            setCurrentIndex(originalDbIndex);
        }
    }

    // Keep navigation buttons active during search so you can cycle immediately 
    updateNavigationButtonsState(false);
    displayItems(filtered);
}
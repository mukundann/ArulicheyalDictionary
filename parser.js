/**
 * Scripture Reference Engine - Data Parser Module
 */

// Helper to expand ranges like "1-3" to [1, 2, 3]
export function expandRange(rangeStr) {
    const parts = rangeStr.split('-');
    if (parts.length === 1) return [parseInt(parts[0], 10)];
    
    const start = parseInt(parts[0], 10);
    const end = parseInt(parts[1], 10);
    const result = [];
    for (let i = start; i <= end; i++) {
        result.push(i);
    }
    return result;
}

// Extract chapter numbers from the Pasuram IDs
export function extractChapterNum(pasuramStr) {
    if (!pasuramStr) return null;
    const firstToken = pasuramStr.split('-')[0].trim();
    const parsed = parseInt(firstToken, 10);
    return isNaN(parsed) ? null : parsed;
}

// Normalize strings like '5.3.4' into '5-3-4'
export function normalizeQueryIndex(str) {
    return str.replace(/[\.\s_]+/g, '-').trim();
}

/**
 * RFC-4180 Compliant CSV Row Splitter
 */
export function parseCSVText(text) {
    const lines = [];
    let row = [""];
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const nextChar = text[i + 1];

        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                row[row.length - 1] += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            row.push("");
        } else if ((char === '\r' || char === '\n') && !inQuotes) {
            if (char === '\r' && nextChar === '\n') {
                i++;
            }
            lines.push(row);
            row = [""];
        } else {
            row[row.length - 1] += char;
        }
    }
    if (row.length > 1 || row[0] !== "") {
        lines.push(row);
    }
    return lines;
}

/**
 * Transforms an array of raw CSV files into an ordered structured database
 */
export function buildDatabase(loadedFiles) {
    let globalSequenceCounter = 0;
    const processingMap = {};

    loadedFiles.forEach(fileObj => {
        const fileName = fileObj.filePath.split('/').pop();
        const parsedRows = parseCSVText(fileObj.rawText);
        
        if (parsedRows.length <= 1) return;
        
        let lastSeenPasuramKey = "";

        for (let i = 1; i < parsedRows.length; i++) {
            const row = parsedRows[i];
            if (!row || row.length < 2) continue;

            const pasuramCol = row[0] ? row[0].trim() : "";
            if (pasuramCol !== "") {
                lastSeenPasuramKey = pasuramCol;
            }

            if (!lastSeenPasuramKey) continue;

            const targetChapter = extractChapterNum(lastSeenPasuramKey);
            if (targetChapter !== null && !fileObj.allowedChapters.includes(targetChapter)) {
                continue;
            }

            const scriptureWord = row[1] ? row[1].trim() : "";
            const englishMeaning = row[2] ? row[2].trim() : "";

            if (!processingMap[lastSeenPasuramKey]) {
                globalSequenceCounter++;
                processingMap[lastSeenPasuramKey] = {
                    globalOrderIndex: globalSequenceCounter,
                    parsedChapter: targetChapter || 0,
                    sourceFile: fileName,
                    pasuramId: lastSeenPasuramKey,
                    fullVerseText: "",
                    rawWordsList: [],
                    wordTokens: []
                };
            }

            if (scriptureWord) {
                if (!englishMeaning && scriptureWord.split(/\s+/).length > 3) {
                    processingMap[lastSeenPasuramKey].fullVerseText = scriptureWord;
                } else {
                    processingMap[lastSeenPasuramKey].rawWordsList.push(scriptureWord);
                    if (englishMeaning) {
                        processingMap[lastSeenPasuramKey].wordTokens.push([scriptureWord, englishMeaning]);
                    }
                }
            }
        }
    });

    // Fallback poetic reconstruction if full text wasn't predefined
    for (const key in processingMap) {
        if (!processingMap[key].fullVerseText && processingMap[key].rawWordsList.length > 0) {
            const cleanWords = processingMap[key].rawWordsList.filter(Boolean);
            const wordsPerLine = 4;
            const lines = [];
            for (let i = 0; i < cleanWords.length; i += wordsPerLine) {
                lines.push(cleanWords.slice(i, i + wordsPerLine).join(" "));
            }
            processingMap[key].fullVerseText = lines.join("\n");
        }
    }

    return Object.values(processingMap).sort((a, b) => a.globalOrderIndex - b.globalOrderIndex);
}
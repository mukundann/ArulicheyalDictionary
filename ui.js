/**
 * Scripture Reference Engine - UI Render Module (Dynamic Scaling Layout)
 */

// Step tracker for current state scale
let currentFontScaleIndex = 0; 

// Layout step dictionaries
const translationScales = [8, 9, 11, 13, 15, 18];  // Meanings text size in pixels
const scriptureScales   = [12, 14, 16, 20, 24, 28]; // Tamil text size in pixels
const boxWidthScales    = [50, 65, 100, 140, 180, 240]; // Maximum word block width tracking

export function changeFontScale(direction) {
    if (direction === 0) {
        currentFontScaleIndex = 2; // Default reset baseline index structure
    } else {
        currentFontScaleIndex += direction;
        // Restrict scale steps to stay safely within dictionary bounds
        if (currentFontScaleIndex < 0) currentFontScaleIndex = 0;
        if (currentFontScaleIndex > 5) currentFontScaleIndex = 5;
    }
}

export function displayInitialState() {
    const container = document.getElementById('cardsList');
    const counter = document.getElementById('counter');
    
    counter.innerText = "Engine Ready";
    container.innerHTML = `
        <div class="text-center py-16 border-2 border-dashed border-slate-700/40 rounded-2xl bg-slate-900/10 max-w-4xl mx-auto w-full">
            <div class="text-amber-500/80 text-3xl mb-3">📖</div>
            <p class="text-slate-300 font-medium text-sm">Direct CSV Datastream Online</p>
            <p class="text-slate-500 text-xs mt-1 max-w-xs mx-auto leading-relaxed">
                Select a specific chapter from the dropdown or type an index target (e.g., <span class="font-mono bg-slate-800 text-amber-400 px-1 rounded text-[11px]">5.3.4</span>) to display verses.
            </p>
        </div>
    `;
}

export function showError(message = "System Error") {
    const counter = document.getElementById('counter');
    const errorView = document.getElementById('errorView');
    const errorText = document.getElementById('errorText');
    
    counter.innerText = "System Error";
    if (errorText) errorText.innerText = message;
    if (errorView) errorView.classList.remove('hidden');
}

export function displayItems(items) {
    const container = document.getElementById('cardsList');
    const counter = document.getElementById('counter');
    container.innerHTML = '';
    
    counter.innerText = `${items.length} Pasurams Loaded`;

    if (items.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12 text-slate-500 w-full">
                <p class="text-sm font-medium">No results match current filters.</p>
            </div>
        `;
        return;
    }

    // Capture calculated scale settings instantly
    const calculatedMeaningSize = translationScales[currentFontScaleIndex];
    const calculatedTamilSize = scriptureScales[currentFontScaleIndex];
    const calculatedMaxWidth = boxWidthScales[currentFontScaleIndex];

    items.forEach(item => {
        const block = document.createElement('div');
        block.className = "w-full bg-slate-800 border border-slate-700/60 rounded-2xl p-4 md:p-8 shadow-md space-y-4 relative overflow-hidden mx-auto max-w-full";
        
        let interlinearHtml = "";
        item.wordTokens.forEach(tok => {
            interlinearHtml += `
                <div class="inline-flex flex-col items-center justify-end m-1.5 pb-1 border-b border-slate-700/30 text-center group hover:border-amber-500/40 transition-all break-words" 
                     style="min-w: 60px; max-w: ${calculatedMaxWidth}px;">
                    
                    <span class="leading-tight text-slate-400 font-sans italic mb-2 px-0.5 max-w-full whitespace-normal group-hover:text-amber-300 transition-colors"
                          style="font-size: ${calculatedMeaningSize}px;" 
                          title="${tok[1]}">
                        ${tok[1]}
                    </span>
                    
                    <span class="font-mono font-bold text-amber-500 tracking-wide select-all px-0.5"
                          style="font-size: ${calculatedTamilSize}px;">
                        ${tok[0]}
                    </span>
                </div>
            `;
        });

        block.innerHTML = `
            <div class="absolute right-0 top-0 bg-slate-900/80 text-[9px] px-3 py-1 font-mono text-amber-200/40 rounded-bl border-l border-b border-slate-700/40">
                ${item.sourceFile}
            </div>
            <div class="mb-1">
                <span class="text-xs font-mono font-black text-amber-600/80 tracking-widest uppercase">${item.pasuramId}</span>
            </div>
            
            <div class="bg-slate-900/40 rounded-xl p-4 md:p-6 border border-slate-700/40 shadow-inner">
                <div class="flex flex-wrap items-end justify-start gap-x-1.5 gap-y-4 md:gap-y-6">
                    ${interlinearHtml || '<p class="text-xs text-slate-500 italic">No breakdown tokens mapped</p>'}
                </div>
            </div>
        `;
        container.appendChild(block);
    });
}
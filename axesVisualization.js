// src/axesVisualization.js
import { AXIS_MIN, AXIS_MAX, AXIS_RANGE } from './data.js';
import { diamondsData } from './data.js'; // Added import for diamondsData
import { getDescriptiveTerm } from './utils.js';

export function redrawAxesDots({ UI, diamondsData, filterYearMax, selectedPopupIndex, isPublicationTypeVisible, highlightDotsForIndex, unhighlightAllDots, handleAxisDotClick }) {
    if (!UI.xAxisBar || !UI.yAxisBar || !UI.zAxisBar) return;

    UI.xAxisBar.innerHTML = '';
    UI.yAxisBar.innerHTML = '';
    UI.zAxisBar.innerHTML = '';

    diamondsData.forEach((diamond, index) => {
        const isVisibleByYear = !diamond.year || diamond.year <= filterYearMax;
        const isVisibleByType = isPublicationTypeVisible(diamond, UI); // Pass UI here

        if (!isVisibleByYear || !isVisibleByType) return;

        const shapeClass = getShapeClassForCategory(diamond.category);
        const categoryString = getCategoryString(diamond.category);

        createAxisDot(UI.xAxisBar, 'x-dot', shapeClass, 'x', index, diamond, categoryString, { handleAxisDotClickCallback: handleAxisDotClick });
        createAxisDot(UI.yAxisBar, 'y-dot', shapeClass, 'y', index, diamond, categoryString, { handleAxisDotClickCallback: handleAxisDotClick });
        createAxisDot(UI.zAxisBar, 'z-dot', shapeClass, 'z', index, diamond, categoryString, { handleAxisDotClickCallback: handleAxisDotClick });
    });

    if (selectedPopupIndex !== null) {
        highlightDotsForIndex(selectedPopupIndex, true, UI);
    }

    updateAxesSelectedItemText(null, UI, selectedPopupIndex); // Pass selectedPopupIndex to update text
}

// Renamed local function to avoid confusion with the exported one
function createAxisDot(axisBar, axisClass, shapeClass, axis, index, diamond, categoryString, { handleAxisDotClickCallback }) {
    const dot = document.createElement('div');
    const percent = calculatePercent(diamond[axis]);
    const title = `${diamond.author || 'Author'} (${categoryString}, ${axis.toUpperCase()}: ${diamond[axis]?.toFixed(1)})`;

    dot.className = `axis-dot ${axisClass} ${shapeClass}`;
    dot.style.left = `${percent}%`;
    dot.dataset.index = index;
    dot.title = title;

    const existingDots = Array.from(axisBar.querySelectorAll('.axis-dot'))
        .filter(existingDot => existingDot.style.left === `${percent}%`);

    if (existingDots.length > 0) {
        const offsetPixels = 8 * existingDots.length;
        const direction = existingDots.length % 2 === 0 ? -1 : 1;
        dot.style.transform = `translate(-50%, calc(-50% + ${direction * offsetPixels}px))`;
    }

    dot.addEventListener('click', (event) => {
        event.stopPropagation();
        console.log(`Dot clicked: Index ${index}, Axis ${axis}`); // ADDED FOR DEBUGGING
        handleAxisDotClickCallback(index, axis); // Call the callback provided by main.js
    });

    axisBar.appendChild(dot);
}

// The main function that handles a click on an axis dot
export function handleAxisDotClick(index, axis, diamondsDataFromMain, UI, setSelectedPopupIndexCallback) { // Renamed diamondsData to diamondsDataFromMain to distinguish from imported one
    if (index === null || index < 0 || index >= diamondsDataFromMain.length || !axis) return;

    const targetPopup = document.getElementById(`${axis}-axis-info-popup`);
    if (!targetPopup) return;

    const headlineEl = targetPopup.querySelector('.popup-headline');
    const citationEl = targetPopup.querySelector('.popup-citation');
    const positioningEl = targetPopup.querySelector('.popup-positioning');

    if (!headlineEl || !citationEl || !positioningEl) {
        console.error(`Error: Missing popup elements for axis ${axis}`);
        return;
    }

    const currentlyOpenPopup = document.querySelector('.axis-info-popup.expanded');
    const isTargetAlreadyOpen = targetPopup.classList.contains('expanded');
    const currentIndexInTarget = parseInt(targetPopup.dataset.currentIndex, 10);

    // Close other popups if opening a new one
    if (currentlyOpenPopup && currentlyOpenPopup !== targetPopup) { closeOpenPopup(currentlyOpenPopup, UI); }

    // Toggle or switch content if clicking same popup axis dot
    if (isTargetAlreadyOpen && currentIndexInTarget === index) {
        closeOpenPopup(targetPopup, UI); // Close if clicking the same dot again
        setSelectedPopupIndexCallback(null); // Clear selected index in main.js
    } else {
        const diamond = diamondsDataFromMain[index]; // Use diamondsDataFromMain
        const info = diamond?.axisInfo?.[axis];
        if (!info) {
            console.warn(`No axisInfo found for index ${index}, axis ${axis}`);
            return; // No info to display
        }

        headlineEl.textContent = `${diamond.author || `Author ${index+1}`} (${diamond.year || 'N/A'})`;
        citationEl.textContent = info.citation || '(No citation provided)';
        positioningEl.textContent = info.positioning || '(No positioning provided)';

        targetPopup.dataset.currentIndex = index;
        unhighlightAllDots(UI);
        highlightDotsForIndex(index, true, UI);
        setSelectedPopupIndexCallback(index); // Update selected index in main.js
        updateAxesSelectedItemText(null, UI, index); // Update text display (will use imported diamondsData)
        targetPopup.classList.add('expanded');
    }
}

export function closeOpenPopup(popup = null, UI) {
    const popupToClose = popup || document.querySelector('.axis-info-popup.expanded');
    if (popupToClose) {
        popupToClose.classList.remove('expanded');
        popupToClose.removeAttribute('data-current-index');
        // Unhighlighting and clearing selected state will be managed by main.js after this call.
    }
}

export function highlightDotsForIndex(index, isSelected, UI) {
    if (!UI.axesVisContainer || index === null || index < 0) return;
    UI.axesVisContainer.querySelectorAll(`.axis-dot[data-index="${index}"]`)
        .forEach(dot => dot.classList.add('highlighted'));
    // updateAxesSelectedItemText is called by handleAxisDotClick or mouseover in main.js
}

export function unhighlightDotsForIndex(index, selectedPopupIndex, UI) {
    // Only unhighlight if it's not the currently selected popup
    if (selectedPopupIndex === index || !UI.axesVisContainer || index === null || index < 0) return;
    UI.axesVisContainer.querySelectorAll(`.axis-dot[data-index="${index}"]`)
        .forEach(dot => dot.classList.remove('highlighted'));
}

export function unhighlightAllDots(UI) {
    UI.axesVisContainer?.querySelectorAll('.axis-dot.highlighted')
        .forEach(dot => dot.classList.remove('highlighted'));
}

export function updateAxesSelectedItemText(hoverIndex = null, UI, selectedIndex = null) {
    if (!UI.axesSelectedItemText) return;

    let text = '';
    // `diamondsData` is imported directly, so it's in scope
    if (selectedIndex !== null && selectedIndex < diamondsData.length) {
        text = `Selected: ${diamondsData[selectedIndex].author || `Author ${selectedIndex + 1}`}`;
    } else if (hoverIndex !== null && hoverIndex < diamondsData.length) {
        text = `Hovering: ${diamondsData[hoverIndex].author || `Author ${hoverIndex + 1}`}`;
    } else {
        const visibleDots = UI.xAxisBar?.querySelectorAll('.axis-dot') ?? [];
        const uniqueIndices = new Set(Array.from(visibleDots).map(dot => dot.dataset.index));
        const visibleCount = uniqueIndices.size;
        text = `Hover over an item in the list below to see its position. (${visibleCount} items shown)`;
    }
    UI.axesSelectedItemText.textContent = text;
}

function calculatePercent(value) {
    const clamped = Math.max(AXIS_MIN, Math.min(AXIS_MAX, value ?? 0));
    return AXIS_RANGE === 0 ? 50 : ((clamped - AXIS_MIN) / AXIS_RANGE) * 100;
}

function getShapeClassForCategory(category) {
    let shapeClass = 'shape-academia';
    if (category.includes('NGOs/Civil Society')) {
        shapeClass = 'shape-ngo';
    } else if (category.includes('Governments/Policy Statements')) {
        shapeClass = 'shape-government';
    }
    return shapeClass;
}

function getCategoryString(category) {
    return Array.isArray(category) && category.length > 0 ? category.join(', ') : 'Unknown Type';
}
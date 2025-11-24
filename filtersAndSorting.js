// src/filtersAndSorting.js
import { diamondsData } from './data.js'; // Added import for diamondsData
// No need to import redrawAxesDots or updateAxesSelectedItemText here directly,
// as they are passed as function arguments.

let currentSortField = null;
let currentSortDirection = null;

export function applyFilters({ UI, diamondsData, filterYearMax, redrawAxesDots, updateAxesSelectedItemText, isPublicationTypeVisible, handleAxisDotClick }) { // Added handleAxisDotClick
    if (!UI.publicationsListOl) return;

    const items = UI.publicationsListOl.children;

    for (const item of items) {
        const index = parseInt(item.dataset.index, 10);
        if (isNaN(index) || index >= diamondsData.length) continue;

        const diamond = diamondsData[index];
        const isVisibleByYear = !diamond.year || diamond.year <= filterYearMax;
        const isVisibleByType = isPublicationTypeVisible(diamond, UI);

        item.classList.toggle('filtered-out', !(isVisibleByYear && isVisibleByType));
    }

    // Pass the `handleAxisDotClick` received by applyFilters to redrawAxesDots
    redrawAxesDots({
        UI,
        diamondsData,
        filterYearMax,
        selectedPopupIndex: null, // No item selected specifically by filter action
        isPublicationTypeVisible,
        highlightDotsForIndex: () => {}, // Dummy or actual if needed within redrawAxesDots itself
        unhighlightAllDots: () => {}, // Dummy or actual if needed within redrawAxesDots itself
        handleAxisDotClick // Pass the actual callback here
    });
    // This function will also call updateAxesSelectedItemText internally.
    updateAxesSelectedItemText(null, UI, null); // Call without diamondsData as it's now imported in axesVisualization
}

export function sortPublications(field, direction, updatePublicationListCallback, UI, callbacksForUpdateList) {
    document.querySelectorAll('.sort-arrow').forEach(arrow => {
        arrow.classList.remove('active');
    });

    const activeArrow = document.getElementById(`${field}${direction}`);
    if (activeArrow) {
        activeArrow.classList.add('active');
    }

    currentSortField = field;
    currentSortDirection = direction;

    diamondsData.sort((a, b) => { // This will now use the imported diamondsData
        let valueA, valueB;

        if (field === 'author') {
            valueA = (a.author || '').toLowerCase();
            valueB = (b.author || '').toLowerCase();
        } else if (field === 'title') {
            valueA = (a.shortTitle || '').toLowerCase();
            valueB = (b.shortTitle || '').toLowerCase();
        } else if (field === 'year') {
            valueA = a.year || 0;
            valueB = b.year || 0;
        }

        if (direction === 'Asc') {
            return valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
        } else {
            return valueA > valueB ? -1 : valueA < valueB ? 1 : 0;
        }
    });

    // Call the callback provided by main.js to update the list, passing the full context
    updatePublicationListCallback({
        publicationsListOl: UI.publicationsListOl,
        diamondsData: diamondsData,
        handleAxisInfoInput: callbacksForUpdateList.handleAxisInfoInput,
        populateFormForEdit: callbacksForUpdateList.populateFormForEdit,
        confirmAndDelete: callbacksForUpdateList.confirmAndDelete,
        handleCategoryCheckboxChange: callbacksForUpdateList.handleCategoryCheckboxChange
    });
}

export function toggleSortOptions(sortOptionsBar) {
    if (sortOptionsBar) {
        sortOptionsBar.classList.toggle('visible');
    }
}
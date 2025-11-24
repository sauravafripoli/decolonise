// src/main.js
import { getDOMElements } from './domElements.js';
import { diamondsData, updateDiamondsData, DEFAULT_AXIS_INFO, CURRENT_YEAR } from './data.js';
import { updatePublicationList, resetForm, populateFormForEdit, handleAxisInfoInput, handleCategoryCheckboxChange } from './ui.js';
import { redrawAxesDots, highlightDotsForIndex, unhighlightDotsForIndex, updateAxesSelectedItemText, closeOpenPopup, unhighlightAllDots, handleAxisDotClick as axesHandleAxisDotClick } from './axesVisualization.js'; // Renamed to avoid conflict
import { applyFilters, sortPublications, toggleSortOptions } from './filtersAndSorting.js'; // Import applyFilters
import { handleImportClick, handleExportClick, handleFileInputChange, processImportedData, arePublicationsDifferent } from './csvHandler.js'; // Also import arePublicationsDifferent
import { showMessage } from './utils.js';

// Global state
let editingDiamondIndex = null;
let selectedPopupIndex = null;
let filterYearMax = CURRENT_YEAR + 1; // Initial value

// UI elements (populated on init)
let UI = {};

function init() {
    UI = getDOMElements();

    // Initial UI setup
    if (UI.timeSlider) {
        UI.timeSlider.max = filterYearMax;
        UI.timeSlider.value = filterYearMax;
    }
    if (UI.timeSliderValueSpan) {
        UI.timeSliderValueSpan.textContent = filterYearMax;
    }
    if (UI.yearInput) {
        UI.yearInput.max = CURRENT_YEAR + 5;
        UI.yearInput.placeholder = `Year (e.g., ${CURRENT_YEAR})`;
    }
    if (UI.addEditButton) {
        UI.addEditButton.textContent = 'Add Publication';
        UI.addEditButton.dataset.editing = "false";
    }

    // Call updatePublicationList with all necessary dependencies/callbacks
    updatePublicationList({
        publicationsListOl: UI.publicationsListOl,
        diamondsData: diamondsData,
        handleAxisInfoInput: (e, data) => handleAxisInfoInput(e, data),
        populateFormForEdit: (index) => {
            editingDiamondIndex = index;
            populateFormForEdit(UI, diamondsData[index]);
            UI.controlsDiv?.scrollTo({ top: 0, behavior: 'smooth' });
            UI.xCoordInput.focus();
        },
        confirmAndDelete: (indexToDelete) => {
            const dataToRemove = diamondsData[indexToDelete];
            if (confirm(`Delete "${dataToRemove.author || `Author ${indexToDelete + 1}`}"?`)) {
                if (editingDiamondIndex === indexToDelete) {
                    resetForm(UI); // Reset form if the deleted item was being edited
                    editingDiamondIndex = null;
                }
                if (selectedPopupIndex === indexToDelete) {
                    closeOpenPopup(null, UI); // Close popup if the deleted item's info was shown
                    selectedPopupIndex = null;
                }

                diamondsData.splice(indexToDelete, 1); // Modify the data array
                updateDiamondsData(diamondsData); // Ensure global data reference is updated in data.js

                // Re-render the list and redraw dots
                updatePublicationList({ // Recursive call to updatePublicationList with new data
                    publicationsListOl: UI.publicationsListOl,
                    diamondsData: diamondsData,
                    handleAxisInfoInput: (e, data) => handleAxisInfoInput(e, data),
                    populateFormForEdit: (idx) => {
                        editingDiamondIndex = idx;
                        populateFormForEdit(UI, diamondsData[idx]);
                        UI.controlsDiv?.scrollTo({ top: 0, behavior: 'smooth' });
                        UI.xCoordInput.focus();
                    },
                    confirmAndDelete: (idx) => confirmAndDelete(idx), // Pass itself for recursive calls
                    handleCategoryCheckboxChange: (e) => handleCategoryCheckboxChange(e, diamondsData, UI)
                });
                redrawAxesDots({
                    UI,
                    diamondsData,
                    filterYearMax,
                    selectedPopupIndex,
                    isPublicationTypeVisible: (d) => isPublicationTypeVisible(d, UI),
                    highlightDotsForIndex,
                    unhighlightAllDots,
                    handleAxisDotClick: (idx, axis) => axesHandleAxisDotClick(idx, axis, diamondsData, UI, (newSelectedPopupIndex) => selectedPopupIndex = newSelectedPopupIndex)
                });
                showMessage('Publication deleted successfully.');
            }
        },
        handleCategoryCheckboxChange: (e) => {
            handleCategoryCheckboxChange(e, diamondsData, UI);
            // After category changes, re-apply filters to update display
            applyFilters({
                UI,
                diamondsData,
                filterYearMax,
                redrawAxesDots,
                updateAxesSelectedItemText,
                isPublicationTypeVisible,
                handleAxisDotClick: (idx, axis) => axesHandleAxisDotClick(idx, axis, diamondsData, UI, (newSelectedPopupIndex) => selectedPopupIndex = newSelectedPopupIndex)
            });
        }
    });

    // Initial filter and redraw (always perform this to ensure correct initial state)
    applyFilters({
        UI,
        diamondsData,
        filterYearMax,
        redrawAxesDots,
        updateAxesSelectedItemText,
        isPublicationTypeVisible,
        handleAxisDotClick: (idx, axis) => axesHandleAxisDotClick(idx, axis, diamondsData, UI, (newSelectedPopupIndex) => selectedPopupIndex = newSelectedPopupIndex) // Pass handleAxisDotClick here
    });
    redrawAxesDots({ // This call is redundant if applyFilters already calls redrawAxesDots
        UI,
        diamondsData,
        filterYearMax,
        selectedPopupIndex,
        isPublicationTypeVisible: (d) => isPublicationTypeVisible(d, UI), // Corrected typo
        highlightDotsForIndex,
        unhighlightAllDots,
        handleAxisDotClick: (idx, axis) => axesHandleAxisDotClick(idx, axis, diamondsData, UI, (newSelectedPopupIndex) => selectedPopupIndex = newSelectedPopupIndex)
    });

    attachEventListeners();
}

function attachEventListeners() {
    UI.timeSlider?.addEventListener('input', (e) => {
        filterYearMax = parseInt(e.target.value, 10);
        if (UI.timeSliderValueSpan) UI.timeSliderValueSpan.textContent = filterYearMax;
        applyFilters({
            UI,
            diamondsData,
            filterYearMax,
            redrawAxesDots,
            updateAxesSelectedItemText,
            isPublicationTypeVisible,
            handleAxisDotClick: (idx, axis) => axesHandleAxisDotClick(idx, axis, diamondsData, UI, (newSelectedPopupIndex) => selectedPopupIndex = newSelectedPopupIndex) // Pass handleAxisDotClick
        });
    });

    UI.addEditButton?.addEventListener('click', () => handleAddEditSubmit({
        UI,
        diamondsData,
        editingDiamondIndex,
        setEditingDiamondIndex: (index) => editingDiamondIndex = index,
        updatePublicationList: () => updatePublicationList({
            publicationsListOl: UI.publicationsListOl,
            diamondsData: diamondsData,
            handleAxisInfoInput: (e, data) => handleAxisInfoInput(e, data),
            populateFormForEdit: (idx) => {
                editingDiamondIndex = idx;
                populateFormForEdit(UI, diamondsData[idx]);
                UI.controlsDiv?.scrollTo({ top: 0, behavior: 'smooth' });
                UI.xCoordInput.focus();
            },
            confirmAndDelete: (idx) => confirmAndDelete(idx),
            handleCategoryCheckboxChange: (e) => handleCategoryCheckboxChange(e, diamondsData, UI)
        }),
        resetForm: () => resetForm(UI),
        applyFilters: () => applyFilters({
            UI,
            diamondsData,
            filterYearMax,
            redrawAxesDots,
            updateAxesSelectedItemText,
            isPublicationTypeVisible,
            handleAxisDotClick: (idx, axis) => axesHandleAxisDotClick(idx, axis, diamondsData, UI, (newSelectedPopupIndex) => selectedPopupIndex = newSelectedPopupIndex) // Pass handleAxisDotClick
        }),
        showMessage
    }));

    UI.importButton?.addEventListener('click', () => UI.csvFileInput.click());
    UI.exportButton?.addEventListener('click', () => handleExportClick(diamondsData, showMessage));
    UI.csvFileInput?.addEventListener('change', (e) => handleFileInputChange(e, (parsedData) => processImportedData(parsedData, diamondsData, arePublicationsDifferent), showMessage));

    UI.toggleSortButton?.addEventListener('click', () => toggleSortOptions(UI.sortOptionsBar));

    // Sort button event listeners, passing necessary context
    const sortCallbacks = {
        updatePublicationList: () => updatePublicationList({
            publicationsListOl: UI.publicationsListOl,
            diamondsData: diamondsData,
            handleAxisInfoInput: (e, data) => handleAxisInfoInput(e, data),
            populateFormForEdit: (idx) => {
                editingDiamondIndex = idx;
                populateFormForEdit(UI, diamondsData[idx]);
                UI.controlsDiv?.scrollTo({ top: 0, behavior: 'smooth' });
                UI.xCoordInput.focus();
            },
            confirmAndDelete: (idx) => confirmAndDelete(idx),
            handleCategoryCheckboxChange: (e) => handleCategoryCheckboxChange(e, diamondsData, UI)
        }),
        UI: UI
    };
    UI.authorAsc?.addEventListener('click', () => sortPublications('author', 'Asc', sortCallbacks.updatePublicationList, UI, { handleAxisInfoInput, populateFormForEdit, confirmAndDelete: (idx) => confirmAndDelete(idx), handleCategoryCheckboxChange }));
    UI.authorDesc?.addEventListener('click', () => sortPublications('author', 'Desc', sortCallbacks.updatePublicationList, UI, { handleAxisInfoInput, populateFormForEdit, confirmAndDelete: (idx) => confirmAndDelete(idx), handleCategoryCheckboxChange }));
    UI.titleAsc?.addEventListener('click', () => sortPublications('title', 'Asc', sortCallbacks.updatePublicationList, UI, { handleAxisInfoInput, populateFormForEdit, confirmAndDelete: (idx) => confirmAndDelete(idx), handleCategoryCheckboxChange }));
    UI.titleDesc?.addEventListener('click', () => sortPublications('title', 'Desc', sortCallbacks.updatePublicationList, UI, { handleAxisInfoInput, populateFormForEdit, confirmAndDelete: (idx) => confirmAndDelete(idx), handleCategoryCheckboxChange }));
    UI.yearAsc?.addEventListener('click', () => sortPublications('year', 'Asc', sortCallbacks.updatePublicationList, UI, { handleAxisInfoInput, populateFormForEdit, confirmAndDelete: (idx) => confirmAndDelete(idx), handleCategoryCheckboxChange }));
    UI.yearDesc?.addEventListener('click', () => sortPublications('year', 'Desc', sortCallbacks.updatePublicationList, UI, { handleAxisInfoInput, populateFormForEdit, confirmAndDelete: (idx) => confirmAndDelete(idx), handleCategoryCheckboxChange }));

    document.querySelectorAll('.axis-info-popup').forEach(popup => {
        popup.addEventListener('click', (event) => {
            if (event.target.tagName === 'TEXTAREA') return;
            event.stopPropagation();
            const index = parseInt(popup.dataset.currentIndex, 10);
            if (!isNaN(index)) scrollToAndExpandListItem(index, UI);
        });
    });

    document.addEventListener('click', (event) => {
        const currentlyOpenPopup = document.querySelector('.axis-info-popup.expanded');
        if (currentlyOpenPopup && !currentlyOpenPopup.contains(event.target) && !event.target.closest('.axis-dot')) {
            closeOpenPopup(currentlyOpenPopup, UI);
            selectedPopupIndex = null; // Clear global selected index as well
            unhighlightAllDots(UI);
            updateAxesSelectedItemText(null, UI, null); // Pass null for selectedIndex to clear text
        }
    });

    if (UI.publicationsListOl) {
        UI.publicationsListOl.addEventListener('mouseover', (event) => {
            const listItem = event.target.closest('li');
            if (listItem && UI.publicationsListOl.contains(listItem)) {
                const index = parseInt(listItem.dataset.index, 10);
                if (!isNaN(index)) {
                    highlightDotsForIndex(index, false, UI);
                    updateAxesSelectedItemText(index, UI, null); // Pass null for selectedIndex on hover
                }
            }
        });

        UI.publicationsListOl.addEventListener('mouseout', (event) => {
            const listItem = event.target.closest('li');
            if (listItem && UI.publicationsListOl.contains(listItem)) {
                const index = parseInt(listItem.dataset.index, 10);
                if (!isNaN(index)) {
                    unhighlightDotsForIndex(index, selectedPopupIndex, UI);
                    updateAxesSelectedItemText(null, UI, null); // Pass null for selectedIndex to clear text
                }
            }
        });
    }

    UI.filterNgoCheckbox?.addEventListener('change', () => applyFilters({
        UI,
        diamondsData,
        filterYearMax,
        redrawAxesDots,
        updateAxesSelectedItemText,
        isPublicationTypeVisible,
        handleAxisDotClick: (idx, axis) => axesHandleAxisDotClick(idx, axis, diamondsData, UI, (newSelectedPopupIndex) => selectedPopupIndex = newSelectedPopupIndex) // Pass handleAxisDotClick
    }));
    UI.filterGovernmentCheckbox?.addEventListener('change', () => applyFilters({
        UI,
        diamondsData,
        filterYearMax,
        redrawAxesDots,
        updateAxesSelectedItemText,
        isPublicationTypeVisible,
        handleAxisDotClick: (idx, axis) => axesHandleAxisDotClick(idx, axis, diamondsData, UI, (newSelectedPopupIndex) => selectedPopupIndex = newSelectedPopupIndex) // Pass handleAxisDotClick
    }));
    UI.filterAcademiaCheckbox?.addEventListener('change', () => applyFilters({
        UI,
        diamondsData,
        filterYearMax,
        redrawAxesDots,
        updateAxesSelectedItemText,
        isPublicationTypeVisible,
        handleAxisDotClick: (idx, axis) => axesHandleAxisDotClick(idx, axis, diamondsData, UI, (newSelectedPopupIndex) => selectedPopupIndex = newSelectedPopupIndex) // Pass handleAxisDotClick
    }));

    UI.toggleControlsButton?.addEventListener('click', toggleControlsPanel);
}

// Helper for adding/editing a publication. Needs to know about current editing state.
function handleAddEditSubmit({ UI, diamondsData, editingDiamondIndex, setEditingDiamondIndex, updatePublicationList, resetForm, applyFilters, showMessage }) {
    const x = parseFloat(UI.xCoordInput.value);
    const y = parseFloat(UI.yCoordInput.value);
    const z = parseFloat(UI.zCoordInput.value);
    const yearVal = parseInt(UI.yearInput.value, 10);
    const author = UI.authorTextInput.value.trim();
    const shortTitle = UI.shortTitleTextInput.value.trim();

    if (isNaN(x) || isNaN(y) || isNaN(z)) { alert('Invalid coordinates.'); return; }

    let yearValue = null;
    if (UI.yearInput.value) {
        if (isNaN(yearVal) || yearVal < 1900 || yearVal > (CURRENT_YEAR + 10)) {
            alert(`Invalid year. Must be between 1900 and ${CURRENT_YEAR + 10}.`); return;
        }
        yearValue = yearVal;
    }

    const category = [];
    if (UI.ngoCheckbox.checked) category.push('NGOs/Civil Society');
    if (UI.governmentCheckbox.checked) category.push('Governments/Policy Statements');
    if (UI.academiaCheckbox.checked) category.push('Academia');

    if (!author && editingDiamondIndex === null && !confirm("Add publication without an author?")) { UI.authorTextInput.focus(); return; }

    try {
        if (editingDiamondIndex !== null) { // Update existing
            const diamondToUpdate = diamondsData[editingDiamondIndex];
            if (!diamondToUpdate) throw new Error("Item to update not found");
            Object.assign(diamondToUpdate, { x, y, z, year: yearValue, author, shortTitle, category });
            showMessage('Publication updated successfully!');
        } else { // Add new
            const newData = { x, y, z, author, shortTitle, year: yearValue, axisInfo: { ...DEFAULT_AXIS_INFO }, category };
            diamondsData.push(newData);
            showMessage('Publication added successfully!');
        }

        updateDiamondsData(diamondsData); // Update the global data reference in data.js

        updatePublicationList(); // This internally calls applyFilters which calls redrawAxesDots
        resetForm();
        setEditingDiamondIndex(null); // Clear editing state
    } catch (error) { console.error("Error during Add/Update:", error); showMessage("Error saving publication data!", 5000, true); }
}

// Helper for visibility based on publication type filters
function isPublicationTypeVisible(diamond, UI) {
    const category = diamond.category;
    const ngoChecked = UI.filterNgoCheckbox.checked;
    const governmentChecked = UI.filterGovernmentCheckbox.checked;
    const academiaChecked = UI.filterAcademiaCheckbox.checked;

    const anyFilterChecked = ngoChecked || governmentChecked || academiaChecked;

    // This logic ensures that if no filters are checked, No items are shown.
    // If *some* filters are checked, then only items matching those checked filters are shown.
    if (!anyFilterChecked) {
        return false; // Show none if no filters are explicitly checked
    } else {
        return (ngoChecked && category.includes('NGOs/Civil Society')) ||
               (governmentChecked && category.includes('Governments/Policy Statements')) ||
               (academiaChecked && category.includes('Academia'));
    }
}

function scrollToAndExpandListItem(index, UI) {
    if (!UI.publicationsListOl || index === null || index < 0 || index >= diamondsData.length) return;

    const listItem = UI.publicationsListOl.querySelector(`li[data-index="${index}"]`);
    if (!listItem) return;

    listItem.classList.add('expanded');

    if (UI.mainContentArea) {
        const containerRect = UI.mainContentArea.getBoundingClientRect();
        const itemRect = listItem.getBoundingClientRect();
        const scrollOffset = itemRect.top - containerRect.top + UI.mainContentArea.scrollTop - 15;
        UI.mainContentArea.scrollTo({ top: scrollOffset, behavior: 'smooth' });
    } else { listItem.scrollIntoView({ behavior: 'smooth', block: 'start' }); }

    listItem.classList.add('highlight-flash');
    setTimeout(() => listItem.classList.remove('highlight-flash'), 1000);
}

function toggleControlsPanel() {
    document.body.classList.toggle('controls-collapsed');
}

document.addEventListener('DOMContentLoaded', init);
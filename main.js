// src/main.js
import { getDOMElements } from './domElements.js';
import { diamondsData, updateDiamondsData, DEFAULT_AXIS_INFO, CURRENT_YEAR } from './data.js';
import { updatePublicationList, resetForm, populateFormForEdit, handleAxisInfoInput, handleCategoryCheckboxChange } from './ui.js';
import { redrawAxesDots, highlightDotsForIndex, unhighlightDotsForIndex, updateAxesSelectedItemText, closeOpenPopup, unhighlightAllDots, handleAxisDotClick as axesHandleAxisDotClick } from './axesVisualization.js';
import { applyFilters, sortPublications, toggleSortOptions } from './filtersAndSorting.js';
import { handleExportClick, handleFileInputChange, processImportedData, arePublicationsDifferent } from './csvHandler.js';
import { showMessage } from './utils.js';
import { initConceptualSpace3D, updateConceptualSpace3D } from './conceptualSpace3d.js';
import { initVAA } from './vaa.js';

let editingDiamondIndex = null;
let selectedPopupIndex = null;
let filterYearMax = CURRENT_YEAR + 1;
let isSyncingFilterControls = false;
let UI = {};

function managementEnabled() {
    return Boolean(UI.addEditButton && UI.xCoordInput && UI.yCoordInput && UI.zCoordInput);
}

function syncFilterControls(source = 'main') {
    if (isSyncingFilterControls) return;
    isSyncingFilterControls = true;

    if (source === 'main') {
        if (UI.timeSlider2d && UI.timeSlider) UI.timeSlider2d.value = UI.timeSlider.value;
        if (UI.timeSliderValueSpan2d && UI.timeSliderValueSpan) UI.timeSliderValueSpan2d.textContent = UI.timeSliderValueSpan.textContent;
        if (UI.filterNgoCheckbox2d && UI.filterNgoCheckbox) UI.filterNgoCheckbox2d.checked = UI.filterNgoCheckbox.checked;
        if (UI.filterGovernmentCheckbox2d && UI.filterGovernmentCheckbox) UI.filterGovernmentCheckbox2d.checked = UI.filterGovernmentCheckbox.checked;
        if (UI.filterAcademiaCheckbox2d && UI.filterAcademiaCheckbox) UI.filterAcademiaCheckbox2d.checked = UI.filterAcademiaCheckbox.checked;
    } else {
        if (UI.timeSlider && UI.timeSlider2d) UI.timeSlider.value = UI.timeSlider2d.value;
        if (UI.timeSliderValueSpan && UI.timeSliderValueSpan2d) UI.timeSliderValueSpan.textContent = UI.timeSliderValueSpan2d.textContent;
        if (UI.filterNgoCheckbox && UI.filterNgoCheckbox2d) UI.filterNgoCheckbox.checked = UI.filterNgoCheckbox2d.checked;
        if (UI.filterGovernmentCheckbox && UI.filterGovernmentCheckbox2d) UI.filterGovernmentCheckbox.checked = UI.filterGovernmentCheckbox2d.checked;
        if (UI.filterAcademiaCheckbox && UI.filterAcademiaCheckbox2d) UI.filterAcademiaCheckbox.checked = UI.filterAcademiaCheckbox2d.checked;
    }

    isSyncingFilterControls = false;
}

function isPublicationTypeVisible(diamond, ui) {
    const ngoChecked = ui.filterNgoCheckbox?.checked ?? ui.filterNgoCheckbox2d?.checked;
    const govChecked = ui.filterGovernmentCheckbox?.checked ?? ui.filterGovernmentCheckbox2d?.checked;
    const acaChecked = ui.filterAcademiaCheckbox?.checked ?? ui.filterAcademiaCheckbox2d?.checked;
    const anyFilterChecked = ngoChecked || govChecked || acaChecked;
    if (ngoChecked === undefined && govChecked === undefined && acaChecked === undefined) return true;
    if (!anyFilterChecked) return false;

    const category = Array.isArray(diamond.category) ? diamond.category : [];

    return (ngoChecked && category.includes('NGOs/Civil Society')) ||
        (govChecked && category.includes('Governments/Policy Statements')) ||
        (acaChecked && category.includes('Academia'));
}

function applyFiltersAndSync3D() {
    applyFilters({
        UI,
        diamondsData,
        filterYearMax,
        redrawAxesDots,
        updateAxesSelectedItemText,
        isPublicationTypeVisible,
        handleAxisDotClick: (idx, axis) => axesHandleAxisDotClick(idx, axis, diamondsData, UI, (v) => (selectedPopupIndex = v))
    });

    updateConceptualSpace3D({ diamondsData, filterYearMax, isPublicationTypeVisible, UI });
}

function getUpdatePublicationListOptions() {
    return {
        publicationsListOl: UI.publicationsListOl,
        diamondsData,
        handleAxisInfoInput: (e, data) => handleAxisInfoInput(e, data),
        populateFormForEdit: managementEnabled()
            ? (index) => {
                editingDiamondIndex = index;
                populateFormForEdit(UI, diamondsData[index]);
                UI.controlsDiv?.scrollTo({ top: 0, behavior: 'smooth' });
                UI.xCoordInput?.focus?.();
            }
            : undefined,
        confirmAndDelete: managementEnabled() ? confirmAndDelete : undefined,
        handleCategoryCheckboxChange: managementEnabled()
            ? (e) => {
                handleCategoryCheckboxChange(e, diamondsData, UI);
                applyFiltersAndSync3D();
            }
            : undefined
    };
}

function confirmAndDelete(indexToDelete) {
    const dataToRemove = diamondsData[indexToDelete];
    if (!dataToRemove) return;
    if (!confirm(`Delete "${dataToRemove.author || `Author ${indexToDelete + 1}`}"?`)) return;

    if (editingDiamondIndex === indexToDelete) {
        resetForm(UI);
        editingDiamondIndex = null;
    }
    if (selectedPopupIndex === indexToDelete) {
        closeOpenPopup(null, UI);
        selectedPopupIndex = null;
    }

    diamondsData.splice(indexToDelete, 1);
    updateDiamondsData(diamondsData);
    updatePublicationList(getUpdatePublicationListOptions());
    applyFiltersAndSync3D();
    showMessage('Publication deleted successfully.');
}

function handleAddEditSubmit() {
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
            alert(`Invalid year. Must be between 1900 and ${CURRENT_YEAR + 10}.`);
            return;
        }
        yearValue = yearVal;
    }

    const category = [];
    if (UI.ngoCheckbox.checked) category.push('NGOs/Civil Society');
    if (UI.governmentCheckbox.checked) category.push('Governments/Policy Statements');
    if (UI.academiaCheckbox.checked) category.push('Academia');

    if (!author && editingDiamondIndex === null && !confirm('Add publication without an author?')) {
        UI.authorTextInput.focus();
        return;
    }

    if (editingDiamondIndex !== null) {
        const diamondToUpdate = diamondsData[editingDiamondIndex];
        if (!diamondToUpdate) {
            showMessage('Error: item to update not found.', 3000, true);
            return;
        }
        Object.assign(diamondToUpdate, { x, y, z, year: yearValue, author, shortTitle, category });
        showMessage('Publication updated successfully!');
    } else {
        diamondsData.push({ x, y, z, author, shortTitle, year: yearValue, axisInfo: { ...DEFAULT_AXIS_INFO }, category });
        showMessage('Publication added successfully!');
    }

    updateDiamondsData(diamondsData);
    updatePublicationList(getUpdatePublicationListOptions());
    applyFiltersAndSync3D();
    resetForm(UI);
    editingDiamondIndex = null;
}

function scrollToAndExpandListItem(index) {
    if (!UI.publicationsListOl || index === null || index < 0 || index >= diamondsData.length) return;

    const listItem = UI.publicationsListOl.querySelector(`li[data-index="${index}"]`);
    if (!listItem) return;

    listItem.classList.add('expanded');

    if (UI.mainContentArea) {
        const containerRect = UI.mainContentArea.getBoundingClientRect();
        const itemRect = listItem.getBoundingClientRect();
        const scrollOffset = itemRect.top - containerRect.top + UI.mainContentArea.scrollTop - 15;
        UI.mainContentArea.scrollTo({ top: scrollOffset, behavior: 'smooth' });
    } else {
        listItem.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    listItem.classList.add('highlight-flash');
    setTimeout(() => listItem.classList.remove('highlight-flash'), 1000);
}

function attachEventListeners() {
    UI.timeSlider?.addEventListener('input', (e) => {
        filterYearMax = parseInt(e.target.value, 10);
        if (UI.timeSliderValueSpan) UI.timeSliderValueSpan.textContent = filterYearMax;
        syncFilterControls('main');
        applyFiltersAndSync3D();
    });

    UI.timeSlider2d?.addEventListener('input', (e) => {
        filterYearMax = parseInt(e.target.value, 10);
        if (UI.timeSliderValueSpan2d) UI.timeSliderValueSpan2d.textContent = filterYearMax;
        syncFilterControls('2d');
        applyFiltersAndSync3D();
    });

    UI.filterNgoCheckbox?.addEventListener('change', () => { syncFilterControls('main'); applyFiltersAndSync3D(); });
    UI.filterGovernmentCheckbox?.addEventListener('change', () => { syncFilterControls('main'); applyFiltersAndSync3D(); });
    UI.filterAcademiaCheckbox?.addEventListener('change', () => { syncFilterControls('main'); applyFiltersAndSync3D(); });
    UI.filterNgoCheckbox2d?.addEventListener('change', () => { syncFilterControls('2d'); applyFiltersAndSync3D(); });
    UI.filterGovernmentCheckbox2d?.addEventListener('change', () => { syncFilterControls('2d'); applyFiltersAndSync3D(); });
    UI.filterAcademiaCheckbox2d?.addEventListener('change', () => { syncFilterControls('2d'); applyFiltersAndSync3D(); });

    UI.toggleSortButton?.addEventListener('click', () => toggleSortOptions(UI.sortOptionsBar));

    const sortCallbacks = {
        handleAxisInfoInput,
        populateFormForEdit: managementEnabled() ? (idx) => {
            editingDiamondIndex = idx;
            populateFormForEdit(UI, diamondsData[idx]);
            UI.controlsDiv?.scrollTo({ top: 0, behavior: 'smooth' });
            UI.xCoordInput?.focus?.();
        } : undefined,
        confirmAndDelete: managementEnabled() ? (idx) => confirmAndDelete(idx) : undefined,
        handleCategoryCheckboxChange: managementEnabled() ? (e) => handleCategoryCheckboxChange(e, diamondsData, UI) : undefined
    };

    const sortAndRefresh = (field, direction) => {
        sortPublications(field, direction, () => updatePublicationList(getUpdatePublicationListOptions()), UI, sortCallbacks);
        setTimeout(() => applyFiltersAndSync3D(), 0);
    };

    UI.authorAsc?.addEventListener('click', () => sortAndRefresh('author', 'Asc'));
    UI.authorDesc?.addEventListener('click', () => sortAndRefresh('author', 'Desc'));
    UI.titleAsc?.addEventListener('click', () => sortAndRefresh('title', 'Asc'));
    UI.titleDesc?.addEventListener('click', () => sortAndRefresh('title', 'Desc'));
    UI.yearAsc?.addEventListener('click', () => sortAndRefresh('year', 'Asc'));
    UI.yearDesc?.addEventListener('click', () => sortAndRefresh('year', 'Desc'));

    document.querySelectorAll('.axis-info-popup').forEach((popup) => {
        popup.addEventListener('click', (event) => {
            if (event.target.tagName === 'TEXTAREA') return;
            event.stopPropagation();
            const index = parseInt(popup.dataset.currentIndex, 10);
            if (!isNaN(index)) scrollToAndExpandListItem(index);
        });
    });

    document.addEventListener('click', (event) => {
        const openPopup = document.querySelector('.axis-info-popup.expanded');
        if (openPopup && !openPopup.contains(event.target) && !event.target.closest('.axis-dot')) {
            closeOpenPopup(openPopup, UI);
            selectedPopupIndex = null;
            unhighlightAllDots(UI);
            updateAxesSelectedItemText(null, UI, null);
        }
    });

    UI.publicationsListOl?.addEventListener('mouseover', (event) => {
        const listItem = event.target.closest('li');
        if (!listItem || !UI.publicationsListOl.contains(listItem)) return;
        const index = parseInt(listItem.dataset.index, 10);
        if (!isNaN(index)) {
            highlightDotsForIndex(index, false, UI);
            updateAxesSelectedItemText(index, UI, null);
        }
    });

    UI.publicationsListOl?.addEventListener('mouseout', (event) => {
        const listItem = event.target.closest('li');
        if (!listItem || !UI.publicationsListOl.contains(listItem)) return;
        const index = parseInt(listItem.dataset.index, 10);
        if (!isNaN(index)) {
            unhighlightDotsForIndex(index, selectedPopupIndex, UI);
            updateAxesSelectedItemText(null, UI, null);
        }
    });

    if (managementEnabled()) {
        UI.addEditButton?.addEventListener('click', handleAddEditSubmit);
        UI.importButton?.addEventListener('click', () => UI.csvFileInput?.click());
        UI.exportButton?.addEventListener('click', () => handleExportClick(diamondsData, showMessage));
        UI.csvFileInput?.addEventListener('change', (e) => handleFileInputChange(e, (parsed) => processImportedData(parsed, diamondsData, arePublicationsDifferent), showMessage));
        UI.toggleControlsButton?.addEventListener('click', () => document.body.classList.toggle('controls-collapsed'));
    }
}

function init() {
    UI = getDOMElements();

    if (UI.timeSlider) {
        UI.timeSlider.max = filterYearMax;
        UI.timeSlider.value = filterYearMax;
    }
    if (UI.timeSliderValueSpan) UI.timeSliderValueSpan.textContent = filterYearMax;

    if (UI.timeSlider2d) {
        UI.timeSlider2d.max = filterYearMax;
        UI.timeSlider2d.value = filterYearMax;
    }
    if (UI.timeSliderValueSpan2d) UI.timeSliderValueSpan2d.textContent = filterYearMax;

    if (managementEnabled()) {
        UI.yearInput.max = CURRENT_YEAR + 5;
        UI.yearInput.placeholder = `Year (e.g., ${CURRENT_YEAR})`;
        UI.addEditButton.textContent = 'Add Publication';
        UI.addEditButton.dataset.editing = 'false';
    }

    initConceptualSpace3D(UI, (index) => scrollToAndExpandListItem(index));
    initVAA(UI, diamondsData);

    syncFilterControls('main');
    updatePublicationList(getUpdatePublicationListOptions());
    applyFiltersAndSync3D();
    attachEventListeners();
}

document.addEventListener('DOMContentLoaded', init);
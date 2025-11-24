// src/ui.js
import { getDescriptiveTerm } from './utils.js';
import { DEFAULT_AXIS_INFO } from './data.js';

export function updatePublicationList({ publicationsListOl, diamondsData, handleAxisInfoInput, populateFormForEdit, confirmAndDelete, handleCategoryCheckboxChange }) {
    if (!publicationsListOl || !Array.isArray(diamondsData)) return;

    publicationsListOl.innerHTML = '';

    diamondsData.forEach((diamond, index) => {
        if (!diamond || typeof diamond.author === 'undefined') return;

        // Pass diamondsData to createPublicationListItem so its inner event listeners can access it
        const li = createPublicationListItem(diamond, index, handleAxisInfoInput, populateFormForEdit, confirmAndDelete, handleCategoryCheckboxChange, diamondsData);
        publicationsListOl.appendChild(li);
    });

    // applyFilters will be called externally by main.js after updatePublicationList
}

// createPublicationListItem needs diamondsData to pass to handleAxisInfoInput's event listener attachment
function createPublicationListItem(diamond, index, handleAxisInfoInputCallback, populateFormForEditCallback, confirmAndDeleteCallback, handleCategoryCheckboxChangeCallback, diamondsData) {
    const li = document.createElement('li');
    li.dataset.index = index;

    const xTerm = getDescriptiveTerm(diamond.x, 'x');
    const yTerm = getDescriptiveTerm(diamond.y, 'y');
    const zTerm = getDescriptiveTerm(diamond.z, 'z');

    li.innerHTML = `
        <div class="list-item-header">
            <span class="author-display">${diamond.author || `Author ${index + 1}`}</span>
            <span class="short-title-display">${diamond.shortTitle || `Short Title ${index + 1}`}</span>
            <span class="year-display">${diamond.year ?? 'N/A'}</span>
        </div>
        <div class="collapsible-content">
            <div class="coord-display">
                <span class="coord-pair x-coord">X: <b>${xTerm}</b> (${diamond.x?.toFixed(1) ?? 'N/A'})</span>
                <span class="coord-pair y-coord">Y: <b>${yTerm}</b> (${diamond.y?.toFixed(1) ?? 'N/A'})</span>
                <span class="coord-pair z-coord">Z: <b>${zTerm}</b> (${diamond.z?.toFixed(1) ?? 'N/A'})</span>
            </div>
            <div class="axis-info-container">
                ${['x', 'y', 'z'].map(axis => `
                    <div class="axis-info-box ${axis}-info">
                        <label class="info-label">Citation (Axis ${axis.toUpperCase()})</label>
                        <textarea placeholder="Enter citation related to the ${axis.toUpperCase()} axis..." data-index="${index}" data-axis="${axis}" data-field="citation">${diamond.axisInfo?.[axis]?.citation ?? ''}</textarea>
                        <label class="info-label">Interpretive Positioning (Axis ${axis.toUpperCase()})</label>
                        <textarea placeholder="Enter interpretive positioning for the ${axis.toUpperCase()} axis..." data-index="${index}" data-axis="${axis}" data-field="positioning">${diamond.axisInfo?.[axis]?.positioning ?? ''}</textarea>
                    </div>
                `).join('')}
            </div>
            <div class="category-filters">
                <label>
                    <input type="checkbox" class="category-checkbox" data-index="${index}" value="NGOs/Civil Society" ${diamond.category.includes('NGOs/Civil Society') ? 'checked' : ''}> NGOs/Civil Society
                </label>
                <label>
                    <input type="checkbox" class="category-checkbox" data-index="${index}" value="Governments/Policy Statements" ${diamond.category.includes('Governments/Policy Statements') ? 'checked' : ''}> Governments/Policy Statements
                </label>
                <label>
                    <input type="checkbox" class="category-checkbox" data-index="${index}" value="Academia" ${diamond.category.includes('Academia') ? 'checked' : ''}> Academia
                </label>
            </div>
            <div class="button-group">
                <button class="edit-button" data-index="${index}">Edit</button>
                <button class="delete-button" data-index="${index}">Delete</button>
            </div>
        </div>`;

    li.querySelector('.list-item-header').addEventListener('click', () => li.classList.toggle('expanded'));
    li.querySelectorAll('textarea').forEach(ta => ta.addEventListener('input', (e) => handleAxisInfoInputCallback(e, diamondsData)));
    li.querySelector('.edit-button').addEventListener('click', (e) => { e.stopPropagation(); populateFormForEditCallback(index); });
    li.querySelector('.delete-button').addEventListener('click', (e) => { e.stopPropagation(); confirmAndDeleteCallback(index); });
    li.querySelectorAll('.category-checkbox').forEach(checkbox => checkbox.addEventListener('change', (e) => handleCategoryCheckboxChangeCallback(e)));

    return li;
}

export function handleAxisInfoInput(event, diamondsData) {
    const { index, axis, field } = event.target.dataset;
    const value = event.target.value;
    const idx = parseInt(index, 10);

    if (isNaN(idx) || !axis || !field || idx < 0 || idx >= diamondsData.length) return;

    diamondsData[idx].axisInfo ??= { x: { ...DEFAULT_AXIS_INFO }, y: { ...DEFAULT_AXIS_INFO }, z: { ...DEFAULT_AXIS_INFO } };
    diamondsData[idx].axisInfo[axis] ??= { ...DEFAULT_AXIS_INFO };
    diamondsData[idx].axisInfo[axis][field] = value;
}


export function populateFormForEdit(UI, diamond) {
    if (!UI || !diamond) return;

    UI.xCoordInput.value = diamond.x ?? 0;
    UI.yCoordInput.value = diamond.y ?? 0;
    UI.zCoordInput.value = diamond.z ?? 0;
    UI.yearInput.value = diamond.year ?? '';
    UI.authorTextInput.value = diamond.author ?? '';
    UI.shortTitleTextInput.value = diamond.shortTitle ?? '';

    UI.ngoCheckbox.checked = diamond.category.includes('NGOs/Civil Society');
    UI.governmentCheckbox.checked = diamond.category.includes('Governments/Policy Statements');
    UI.academiaCheckbox.checked = diamond.category.includes('Academia');

    UI.addEditButton.textContent = 'Update Publication';
    UI.addEditButton.dataset.editing = "true";
}

export function resetForm(UI) {
    if (!UI) return;
    UI.xCoordInput.value = '0';
    UI.yCoordInput.value = '0';
    UI.zCoordInput.value = '0';
    UI.yearInput.value = '';
    UI.authorTextInput.value = '';
    UI.shortTitleTextInput.value = '';
    UI.ngoCheckbox.checked = false;
    UI.governmentCheckbox.checked = false;
    UI.academiaCheckbox.checked = false;
    UI.addEditButton.textContent = 'Add Publication';
    UI.addEditButton.dataset.editing = "false";
}

export function handleCategoryCheckboxChange(event, diamondsData, UI) {
    const { index } = event.target.dataset;
    const value = event.target.value;
    const isChecked = event.target.checked;
    const idx = parseInt(index, 10);

    if (isNaN(idx) || idx < 0 || idx >= diamondsData.length) return;

    const category = diamondsData[idx].category;
    if (isChecked) {
        if (!category.includes(value)) { // Prevent duplicates
            category.push(value);
        }
    } else {
        const catIndex = category.indexOf(value);
        if (catIndex > -1) {
            category.splice(catIndex, 1);
        }
    }

    // Update the corresponding filter checkbox in the controls panel
    if (value === 'NGOs/Civil Society') {
        UI.filterNgoCheckbox.checked = category.includes('NGOs/Civil Society');
    } else if (value === 'Governments/Policy Statements') {
        UI.filterGovernmentCheckbox.checked = category.includes('Governments/Policy Statements');
    } else if (value === 'Academia') {
        UI.filterAcademiaCheckbox.checked = category.includes('Academia');
    }

    // Trigger re-filtering in main.js after this update
    // This is a dependency that main.js will manage
}
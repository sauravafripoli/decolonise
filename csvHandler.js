// src/csvHandler.js
import { DEFAULT_AXIS_INFO } from './data.js';
import { updateDiamondsData } from './data.js'; // Import function to update data
import { showMessage } from './utils.js'; // Import showMessage

export function handleImportClick(csvFileInput) {
    csvFileInput.click();
}

export function handleExportClick(diamondsData, showMessage) {
    const headers = [
        'Author', 'Short Title', 'Year',
        'X', 'Y', 'Z',
        'X Citation', 'X Positioning',
        'Y Citation', 'Y Positioning',
        'Z Citation', 'Z Positioning',
        'Category'
    ];

    const csvContent = diamondsData.map(d => {
        const axisInfo = d.axisInfo ?? { x: {}, y: {}, z: {} };
        const xInfo = axisInfo.x ?? {};
        const yInfo = axisInfo.y ?? {};
        const zInfo = axisInfo.z ?? {};

        const row = [
            d.author,
            d.shortTitle,
            d.year,
            d.x,
            d.y,
            d.z,
            xInfo.citation,
            xInfo.positioning,
            yInfo.citation,
            yInfo.positioning,
            zInfo.citation,
            zInfo.positioning,
            Array.isArray(d.category) ? d.category.join(';') : ''
        ];
        return row.map(escapeCsvField).join(',');
    }).join('\n');

    const csvHeader = headers.map(escapeCsvField).join(',') + '\n';
    const csvBlob = new Blob([csvHeader + csvContent], { type: 'text/csv;charset=utf-8;' });
    const csvUrl = URL.createObjectURL(csvBlob);

    const downloadLink = document.createElement('a');
    downloadLink.href = csvUrl;
    downloadLink.download = 'publications.csv';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    showMessage('CSV file exported successfully!');
}

export function handleFileInputChange(event, processImportedDataCallback, showMessage) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const csvData = e.target.result;
        try {
            const parsedData = parseCSV(csvData);
            if (parsedData) {
                processImportedDataCallback(parsedData);
                // Message shown by processImportedData
            } else {
                showMessage('CSV file appears empty or invalid.', 5000, true);
            }
        } catch (error) {
            console.error("Error processing CSV:", error);
            showMessage(`Error processing CSV: ${error.message}`, 5000, true);
        }
    };
    reader.onerror = (e) => {
        console.error("Error reading file:", e);
        showMessage('Error reading the selected file!', 5000, true);
    };
    reader.readAsText(file);
    event.target.value = null; // Reset file input
}

export function processImportedData(importedPublications, currentDiamondsData, arePublicationsDifferentCallback) {
    const conflicts = [];
    const newPublications = [];

    importedPublications.forEach(importedPub => {
        importedPub.category = Array.isArray(importedPub.category) ? importedPub.category : (importedPub.category ? [String(importedPub.category)] : []);
        importedPub.axisInfo ??= { x: { ...DEFAULT_AXIS_INFO }, y: { ...DEFAULT_AXIS_INFO }, z: { ...DEFAULT_AXIS_INFO } };
        ['x', 'y', 'z'].forEach(axis => importedPub.axisInfo[axis] ??= { ...DEFAULT_AXIS_INFO });

        const existingIndex = currentDiamondsData.findIndex(existingPub =>
            existingPub.author?.toLowerCase() === importedPub.author?.toLowerCase() &&
            existingPub.shortTitle?.toLowerCase() === importedPub.shortTitle?.toLowerCase() &&
            existingPub.year == importedPub.year
        );

        if (existingIndex !== -1) {
            const existingPub = currentDiamondsData[existingIndex];
            if (arePublicationsDifferentCallback(existingPub, importedPub)) {
                conflicts.push({ existingIndex, existingPub, importedPub });
            } else {
                console.log(`Skipping identical publication: ${importedPub.author} (${importedPub.year})`);
            }
        } else {
            newPublications.push(importedPub);
        }
    });

    // Add all new publications first
    currentDiamondsData.push(...newPublications);
    console.log(`Added ${newPublications.length} new publications.`);

    let conflictsResolved = 0;
    conflicts.forEach(conflict => {
        const { existingPub, importedPub } = conflict;
        const currentExistingIndex = currentDiamondsData.findIndex(d => d === existingPub);

        if (currentExistingIndex === -1) {
            console.warn("Conflict resolution skipped: Existing item seems to have been removed or altered.");
            return;
        }

        const userChoice = confirm(
            `Conflict found for "${existingPub.author} - ${existingPub.shortTitle} (${existingPub.year})".\n\n` +
            `Keep EXISTING data?\n` +
            `(X:${existingPub.x}, Y:${existingPub.y}, Z:${existingPub.z}, Cat:[${existingPub.category?.join(',')}]\n` +
            `X Cit: ${existingPub.axisInfo?.x?.citation?.substring(0,20)}...\n` +
            `X Pos: ${existingPub.axisInfo?.x?.positioning?.substring(0,20)}... etc.)\n\n` +
            `Or replace with IMPORTED data?\n` +
            `(X:${importedPub.x}, Y:${importedPub.y}, Z:${importedPub.z}, Cat:[${importedPub.category?.join(',')}]\n` +
            `X Cit: ${importedPub.axisInfo?.x?.citation?.substring(0,20)}...\n` +
            `X Pos: ${importedPub.axisInfo?.x?.positioning?.substring(0,20)}... etc.)\n\n` +
            `Choose:\n - OK to keep EXISTING\n - Cancel to use IMPORTED`
        );

        if (!userChoice) { // User chose Cancel (Use Imported)
            currentDiamondsData[currentExistingIndex] = importedPub;
            console.log(`Conflict resolved: Replaced with imported data for "${existingPub.author}"`);
            conflictsResolved++;
        } else {
            console.log(`Conflict resolved: Kept existing data for "${existingPub.author}"`);
        }
    });

    updateDiamondsData(currentDiamondsData); // Update the main data reference in data.js

    if (conflicts.length > 0) {
        showMessage(`Import complete. ${newPublications.length} added, ${conflicts.length} conflicts found (${conflictsResolved} updated).`);
    } else {
        showMessage(`Import complete. ${newPublications.length} added, no conflicts.`);
    }
}

export function arePublicationsDifferent(pub1, pub2) {
    // Compare coordinates (handle potential null/undefined)
    if (Number(pub1.x?.toFixed(1)) !== Number(pub2.x?.toFixed(1))) return true;
    if (Number(pub1.y?.toFixed(1)) !== Number(pub2.y?.toFixed(1))) return true;
    if (Number(pub1.z?.toFixed(1)) !== Number(pub2.z?.toFixed(1))) return true;

    // Compare axisInfo
    for (const axis of ['x', 'y', 'z']) {
        const info1 = pub1.axisInfo?.[axis] ?? {};
        const info2 = pub2.axisInfo?.[axis] ?? {};
        if ((info1.citation ?? '') !== (info2.citation ?? '')) return true;
        if ((info1.positioning ?? '') !== (info2.positioning ?? '')) return true;
    }

    // Compare categories (treat as sets for order independence)
    const categories1 = new Set(Array.isArray(pub1.category) ? pub1.category : []);
    const categories2 = new Set(Array.isArray(pub2.category) ? pub2.category : []);
    if (categories1.size !== categories2.size || ![...categories1].every(cat => categories2.has(cat))) {
        return true;
    }

    return false; // No differences found
}

// Helper function to escape CSV fields containing commas, quotes, or newlines
function escapeCsvField(field) {
    const stringField = String(field ?? '');
    if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
        return `"${stringField.replace(/"/g, '""')}"`;
    }
    return stringField;
}

// Helper to parse CSV with potential quotes and commas
function parseCsvLine(line) {
    const result = [];
    let currentField = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                currentField += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            result.push(currentField.trim());
            currentField = '';
        } else {
            currentField += char;
        }
    }
    result.push(currentField.trim());
    return result;
}

function parseCSV(csv) {
    const lines = csv.split(/\r?\n/);
    if (lines.length < 2) return null;

    const expectedHeaders = [
        'Author', 'Short Title', 'Year',
        'X', 'Y', 'Z',
        'X Citation', 'X Positioning',
        'Y Citation', 'Y Positioning',
        'Z Citation', 'Z Positioning',
        'Category'
    ];
    const headerLine = lines[0];
    const cleanedHeaderLine = headerLine.trim();
    const actualHeaders = parseCsvLine(cleanedHeaderLine).map(h => h.toLowerCase().trim());

    const headerMap = {};
    expectedHeaders.forEach(expected => {
        const index = actualHeaders.indexOf(expected.toLowerCase());
        if (index !== -1) {
            headerMap[expected] = index;
        } else {
            console.warn(`CSV header "${expected}" not found.`);
        }
    });

    if (headerMap['Author'] === undefined || headerMap['Short Title'] === undefined || headerMap['Year'] === undefined) {
        throw new Error("CSV must contain at least 'Author', 'Short Title', and 'Year' columns.");
    }

    const data = [];
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const cleanedLine = line.replace(/"/g, '').trim();
        const values = parseCsvLine(cleanedLine);

        const getVal = (headerName) => values[headerMap[headerName]] ?? '';

        const entry = {
            author: getVal('Author'),
            shortTitle: getVal('Short Title'),
            year: parseInt(getVal('Year'), 10) || null,
            x: parseFloat(getVal('X')) || 0,
            y: parseFloat(getVal('Y')) || 0,
            z: parseFloat(getVal('Z')) || 0,
            axisInfo: {
                x: { citation: getVal('X Citation'), positioning: getVal('X Positioning') },
                y: { citation: getVal('Y Citation'), positioning: getVal('Y Positioning') },
                z: { citation: getVal('Z Citation'), positioning: getVal('Z Positioning') }
            },
            category: getVal('Category').split(';').map(cat => cat.trim()).filter(cat => cat)
        };

        if (entry.author || entry.shortTitle) {
            data.push(entry);
        } else {
            console.warn(`Skipping row ${i+1} due to missing Author and Short Title.`);
        }
    }
    return data;
}
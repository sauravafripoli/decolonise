// src/utils.js
let messageTimeout = null;
import { AXIS_MIN, AXIS_MAX } from './data.js'; // Import necessary constants

export function showMessage(msg, duration = 3000, isError = false) {
    const messageBox = document.getElementById('message-box');
    if (!messageBox) { alert(msg); return; }

    messageBox.textContent = msg;
    messageBox.className = 'show-message' + (isError ? ' error' : '');

    if (messageTimeout) clearTimeout(messageTimeout);

    messageTimeout = setTimeout(() => {
        if (messageBox) messageBox.className = '';
        messageTimeout = null;
    }, duration);
}

export function getDescriptiveTerm(value, axis) {
    const val = value ?? 0;

    const ranges = {
        x: [
            { range: [-10, -6], term: 'strongly reform' },
            { range: [-5, -2], term: 'moderately reform' },
            { range: [-1, -1], term: 'slightly reform' },
            { range: [0, 0], term: 'not mentioned' },
            { range: [1, 1], term: 'slightly transformative' },
            { range: [2, 5], term: 'moderately transformative' },
            { range: [6, 10], term: 'strongly transformative' }
        ],
        y: [
            { range: [-10, -6], term: 'strongly collective' },
            { range: [-5, -2], term: 'moderately collective' },
            { range: [-1, -1], term: 'slightly collective' },
            { range: [0, 0], term: 'not mentioned' },
            { range: [1, 1], term: 'slightly individual' },
            { range: [2, 5], term: 'moderately individual' },
            { range: [6, 10], term: 'strongly individual' }
        ],
        z: [
            { range: [-10, -6], term: 'strongly western' },
            { range: [-5, -2], term: 'moderately western' },
            { range: [-1, -1], term: 'slightly western' },
            { range: [0, 0], term: 'not mentioned' },
            { range: [1, 1], term: 'slightly global south' },
            { range: [2, 5], term: 'moderately global south' },
            { range: [6, 10], term: 'strongly global south' }
        ]
    };

    const axisRanges = ranges[axis];
    if (!axisRanges) return 'N/A';

    for (const { range, term } of axisRanges) {
        if (val >= range[0] && val <= range[1]) {
            return term;
        }
    }
    return 'N/A';
}
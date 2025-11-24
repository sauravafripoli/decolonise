<?php 
// Your header include
include('header.inc.php'); 
?>

<!-- <div id="controls">
    <div style="margin-top: 40px;">
        <h2 style="font-size: 1.2em; color: #2d3748; margin: 0 0 12px 0; padding-bottom: 8px; border-bottom: 1px solid #e2e8f0;">Add / Edit Publication</h2>
        <div class="coord-inputs">
                <div class="coord-input-group">
                    <label for="xCoord">X: <span class="axis-concept-label">(+Transformative / -Reform)</span></label>
                    <input type="number" id="xCoord" step="0.1" value="0" placeholder="X">
                </div>
                <div class="coord-input-group">
                    <label for="yCoord">Y: <span class="axis-concept-label">(+Individual / -Collective)</span></label>
                    <input type="number" id="yCoord" step="0.1" value="0" placeholder="Y">
                </div>
                <div class="coord-input-group">
                    <label for="zCoord">Z: <span class="axis-concept-label">(+Global South / -Western)</span></label>
                    <input type="number" id="zCoord" step="0.1" value="0" placeholder="Z">
                </div>
                <div class="coord-input-group">
                    <label for="yearInput">Year:</label>
                    <input type="number" id="yearInput" min="1900" max="2050" step="1" placeholder="Year">
                </div>
                <div class="coord-input-group" style="margin-top: 10px;">
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        <label for="typeCheckboxes" style="margin-bottom: 0;">Type of Publication:</label>
                        <div style="display: block; align-items: center; gap: 4px;">
                            <label style="display: flex; align-items: center; gap: 4px;">
                                <input type="checkbox" id="ngoCheckbox">
                                <span class="empty-ngo-dot"></span>
                                NGOs/Civil Society
                            </label>
                            <label style="display: flex; align-items: center; gap: 4px;">
                                <input type="checkbox" id="governmentCheckbox">
                                <span class="empty-government-dot"></span>
                                Governments/Policy Statements
                            </label>
                            <label style="display: flex; align-items: center; gap: 4px;">
                                <input type="checkbox" id="academiaCheckbox">
                                <span class="empty-academia-dot"></span>
                                Academia
                            </label>
                        </div>
                    </div>
                </div>
                <div class="coord-input-group">
                    <label for="authorText">Author:</label>
                    <input type="text" id="authorText" placeholder="Author (e.g., John Doe)">
                </div>
                <div class="coord-input-group">
                    <label for="shortTitleText">Short Title:</label>
                    <input type="text" id="shortTitleText" placeholder="Short Title (e.g., Study on...)">
                </div>
            </div>
            <button id="addEditButton">Add Publication</button>
            <button id="importButton">Import CSV</button>
            <button id="exportButton">Export CSV</button>
            <input type="file" id="csvFileInput" style="display: none;">
        </div>
        <hr>
    </div> -->


<div id="main-content">
    <div id="axes-visualization">
            <h1 style="font-size: 1.8em; color: #2d3748; margin: 0 0 10px 0; padding-bottom: 8px; border-bottom: 1px solid #e2e8f0;">Decolonising Development</h1>
            <h2 style="font-size: 1em; font-weight: 500; color: #4a5568; margin: 0 0 20px 0;">Visualisation of Conceptual Axes across Publications from Academia, NGOs/Civil Society and Governments/Policy Statements</h2>
            <div class="axis-bar-container">
                <span class="axis-label-neg" title="Reform means making incremental changes within existing structures rather than challenging the system itself.">- Reform</span>
                <div class="axis-bar x-axis"></div>
                <span class="axis-label-pos" title="Transformative means aiming for deep, systemic change.">+ Transformation</span>
                <span class="axis-name">(X)</span>
            </div>
            <div class="axis-info-popup x-info" id="x-axis-info-popup" data-axis="x">
                <h5 class="popup-headline"></h5>
                <p class="popup-citation"></p>
                <p class="popup-positioning"></p>
            </div>
            <div class="axis-bar-container">
                <span class="axis-label-neg" title="Collective emphasizes group agency, community action, and shared ownership over outcomes.">- Collective</span>
                <div class="axis-bar y-axis"></div>
                <span class="axis-label-pos" title="Individual focuses on personal agency, self-determination, and autonomy in decision-making.">+ Individual</span>
                <span class="axis-name">(Y)</span>
            </div>
            <div class="axis-info-popup y-info" id="y-axis-info-popup" data-axis="y">
                <h5 class="popup-headline"></h5>
                <p class="popup-citation"></p>
                <p class="popup-positioning"></p>
            </div>
            <div class="axis-bar-container">
                <span class="axis-label-neg" title="Western refers to development approaches rooted in Euro-centric worldviews and power structures.">- Western</span>
                <div class="axis-bar z-axis"></div>
                <span class="axis-label-pos" title="Global South highlights perspectives, priorities, and experiences of formerly colonized or marginalized regions.">+ Global South</span>
                <span class="axis-name">(Z)</span>
            </div>
            <div class="axis-info-popup z-info" id="z-axis-info-popup" data-axis="z">
                <h5 class="popup-headline"></h5>
                <p class="popup-citation"></p>
                <p class="popup-positioning"></p>
            </div>
            <div id="axes-selected-item">Hover over an item in the list below to see its position.</div>
        </div>

        <div class="filters-row">
            <div id="slider-container" class="filter-container">
                <div>
                    <h3>Year of Publication</h3>
                    <label for="timeSlider" id="timeSliderLabel">
                        <span>Filter by year:</span>
                        <span id="timeSliderValue">2025</span>
                    </label>
                    <input type="range" id="timeSlider" min="1980" max="2025" value="2025" step="1">
                </div>
            </div>

            <div id="type-container" class="filter-container">
                <div>
                    <h3>Publication Type</h3>
                    <label>Filter publications by category:</label>
                    <div class="checkbox-group">
                        <label class="checkbox-label">
                            <input type="checkbox" id="filterNgoCheckbox" checked> NGOs/Civil Society
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" id="filterGovernmentCheckbox" checked> Governments/Policy Statements
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" id="filterAcademiaCheckbox" checked> Academia
                        </label>
                    </div>
                </div>
            </div>
        </div>

        <div class="heading-with-button">
            <h3>Publication List</h3>
            <button class="sort-button" id="toggleSortButton">Sort</button>
        </div>
        <div class="sort-options" id="sortOptionsBar">
            <div class="sort-option">
                <span>Author</span>
                <div class="sort-arrows">
                    <span class="sort-arrow" id="authorAsc">▲</span>
                    <span class="sort-arrow" id="authorDesc">▼</span>
                </div>
            </div>
            <div class="sort-option">
                <span>Title</span>
                <div class="sort-arrows">
                    <span class="sort-arrow" id="titleAsc">▲</span>
                    <span class="sort-arrow" id="titleDesc">▼</span>
                </div>
            </div>
            <div class="sort-option">
                <span>Year</span>
                <div class="sort-arrows">
                    <span class="sort-arrow" id="yearAsc">▲</span>
                    <span class="sort-arrow" id="yearDesc">▼</span>
                </div>
            </div>
        </div>
        <div id="publications-list">
            <ol id="publications-list-ol"></ol>
        </div>
    </div>
</div>

<div id="message-box"></div>

<?php 
// Your footer include
include('footer.inc.php'); 
?>
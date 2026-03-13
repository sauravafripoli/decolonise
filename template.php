<?php 
// Your header include
include('header.inc.php'); 
?>

<div id="main-content">
    <div class="header-container">
        <h1>Decolonising Development: Exploring Conceptual Spaces</h1>
        <p>
            Civil society, academic and government views and activities around "decolonising development" span a broad range of positions - they open up a conceptual space. Exploring this space is a key part of engaging with the topic. This tool invites you to engage in an interactive exploration in three steps. First, you are invited to explore different viewpoints along three conceptual axes in the Axes View. Then, you can explore how these positions relate in the conceptual space view in the Your Position section. Lastly, you are invited to position yourself in the conceptual space you have just explored.
        </p>
    </div>

    <h2 class="section-header">1. Axes View</h2>
    <div id="axes-visualization">
            <h2 style="font-size: 1em; font-weight: 500; color: #4a5568; margin: 0 0 20px 0;">Visualisation of Conceptual Axes across Publications</h2>
            <div class="axis-bar-container">
                <span class="axis-label-neg" title="Reform means making incremental changes within existing structures rather than challenging the system itself.">- Reform</span>
                <div class="axis-bar x-axis" id="x-axis-bar"></div>
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
            <div id="axes-selected-item">Click on a shape on any of the axes to learn more about the source it represents.</div>

            <div class="filters-row" id="filters-row-2d" style="margin-top: 15px; padding-top: 0;">
                <div id="slider-container-2d" class="filter-container">
                    <div>
                        <h3>Year of Publication</h3>
                        <label for="timeSlider-2d" id="timeSliderLabel-2d">
                            <span>Filter by year:</span>
                            <span id="timeSliderValue-2d">2025</span>
                        </label>
                        <input type="range" id="timeSlider-2d" min="1980" max="2025" value="2025" step="1">
                    </div>
                </div>

                <div id="type-container-2d" class="filter-container">
                    <div>
                        <h3>Publication Type</h3>
                        <label>Filter publications by category:</label>
                        <div class="checkbox-group">
                            <label class="checkbox-label"><input type="checkbox" id="filterNgoCheckbox-2d" checked><span class="empty-ngo-dot"></span> NGOs/Civil Society</label>
                            <label class="checkbox-label"><input type="checkbox" id="filterGovernmentCheckbox-2d" checked><span class="empty-government-dot"></span> Governments/Policy Statements</label>
                            <label class="checkbox-label"><input type="checkbox" id="filterAcademiaCheckbox-2d" checked><span class="empty-academia-dot"></span> Academia</label>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <h2 class="section-header">2. Conceptual Space View</h2>
        <div id="canvas-container">
            <div id="tooltip"></div>

            <div id="nav-controls">
                <button id="btn-rotate-left" class="nav-btn" title="Rotate Left">↺</button>
                <button id="btn-rotate-right" class="nav-btn" title="Rotate Right">↻</button>
                <div style="width: 10px;"></div>
                <button id="btn-zoom-out" class="nav-btn" title="Zoom Out">−</button>
                <button id="btn-zoom-in" class="nav-btn" title="Zoom In">+</button>
            </div>

            <div id="quadrant-labels-container"></div>

            <div id="publication-card">
                <button class="close-btn" id="close-publication-card">&times;</button>
                <h3 id="card-title">Publication Title</h3>
                <div class="meta" id="card-meta">Author, Year</div>
                <div class="coords" id="card-coords">
                    <span class="coord-tag" id="card-x">Reform</span>
                    <span class="coord-tag" id="card-y">Collective</span>
                    <span class="coord-tag" id="card-z">Western</span>
                </div>
                <div class="summary" id="card-summary">Summary text goes here...</div>
            </div>
        </div>

        <div id="octant-nav"></div>

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
                            <input type="checkbox" id="filterNgoCheckbox" checked><span class="empty-ngo-dot"></span> NGOs/Civil Society
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" id="filterGovernmentCheckbox" checked><span class="empty-government-dot"></span> Governments/Policy Statements
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" id="filterAcademiaCheckbox" checked><span class="empty-academia-dot"></span> Academia
                        </label>
                    </div>
                </div>
            </div>
        </div>

        <div id="vaa-container">
            <div id="vaa-start-screen">
                <h3 style="text-align: left; font-size: 1.4rem; color: #2d3748; margin-bottom: 5px;">3. Your Position</h3>
                <h4 style="text-align: left; font-size: 1rem; color: #4a5568; margin-top: 0; font-weight: 400;">Find out where you stand and explore views close to and opposite your own.</h4>
                <p>Answer a few questions to see where you stand in the conceptual space of decolonising development.</p>
                <button id="btn-start-vaa">Start Assessment</button>
            </div>

            <div id="vaa-quiz-screen" style="display: none;">
                <h3 style="text-align: left; font-size: 1.4rem; color: #2d3748; margin-bottom: 5px;">3. Your Position</h3>
                <h4 style="text-align: left; font-size: 1rem; color: #4a5568; margin-top: 0; font-weight: 400;">Find out where you stand and explore views close to and opposite your own.</h4>
                <div class="vaa-progress">Question <span id="vaa-q-current">1</span> of <span id="vaa-q-total">6</span></div>
                <h4 id="vaa-question-text">Question text goes here...</h4>
                <div class="vaa-options">
                    <button class="vaa-btn" data-value="2">Strongly Agree</button>
                    <button class="vaa-btn" data-value="1">Agree</button>
                    <button class="vaa-btn" data-value="0">Neutral</button>
                    <button class="vaa-btn" data-value="-1">Disagree</button>
                    <button class="vaa-btn" data-value="-2">Strongly Disagree</button>
                </div>
            </div>

            <div id="vaa-result-screen" style="display: none;">
                <h3 style="text-align: left; font-size: 1.4rem; color: #2d3748; margin-bottom: 5px;">3. Your Position</h3>
                <h4 style="text-align: left; font-size: 1rem; color: #4a5568; margin-top: 0; font-weight: 400;">Find out where you stand and explore views close to and opposite your own.</h4>
                <div id="vaa-mini-vis-container"></div>
                <div id="vaa-result-text"></div>
                <button id="btn-restart-vaa" style="margin-top: 15px;">Retake Assessment</button>
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
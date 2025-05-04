// init map
const map = L.map('map').setView([34.0522, -118.2437], 10); // set map center

// check if dark mode enabled
function isDarkMode() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

// get correct tile layer for mode
function getTileLayer() {
    if (isDarkMode()) {
        // use dark tiles for dark mode
        return L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 19
        });
    } else {
        // use default tiles for light mode
        return L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '\u00a9 OpenStreetMap contributors'
        });
    }
}

// update map tile layer
function setMapTileLayer() {
    map.eachLayer(function (layer) {
        if (layer instanceof L.TileLayer) {
            map.removeLayer(layer);
        }
    });
    getTileLayer().addTo(map);
}

// initial map setup
setMapTileLayer();
// listen for dark mode changes
if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', setMapTileLayer);
}

// add legend to map
const legend = L.control({ position: 'topright' });

const quantBoundary = 3000000; // max value for color scale

const parCatRectLabelLength = 80; // max length of labels in parallel categories plot

// layer variables for map
let pointsLayer;
let heatmapLayer;

// get ui element references
const pointsButton = document.getElementById('pointsButton');
const heatmapButton = document.getElementById('heatmapButton');
const yearSelect = document.getElementById('yearSelect');
const incidentSelect = document.getElementById('incidentSelect');
const colorFieldSelect = document.getElementById('colorFieldSelect');
const pieChartButton = document.getElementById('pieChartButton');
const barChartButton = document.getElementById('barChartButton');

const files = [
    'data_split/1.geojso',
    'data_split/2.geojso',
    'data_split/3.geojso',
    'data_split/4.geojso',
    'data_split/5.geojso'
];

// load all geojson files
Promise.all(files.map(f => d3.json(f)))
    .then(datasets => {
        // merge all features
        const allFeatures = datasets.flatMap(d => d.features);
        // create single feature collection
        const data = {
            type: "FeatureCollection",
            features: allFeatures
        };
        // build year dropdown
        const years = [...new Set(data.features.map(f => f.properties.INCIDENTSTARTYEAR))].filter(y => y).sort((a, b) => b - a);
        yearSelect.innerHTML = '';
        years.forEach(year => {
            const option = document.createElement('option');
            option.value = year;
            option.text = year;
            yearSelect.appendChild(option);
        });
        // set default year to 2025
        if (years.includes(2025)) yearSelect.value = 2025;
        // build incident dropdown for year
        function populateIncidentDropdown(selectedYear) {
            const incidentsForYear = [...new Set(data.features.filter(f => f.properties.INCIDENTSTARTYEAR == selectedYear).map(f => f.properties.INCIDENTNAME))].sort();
            incidentSelect.innerHTML = '';
            const allOption = document.createElement('option');
            allOption.value = 'All Incidents';
            allOption.text = 'All Incidents';
            incidentSelect.appendChild(allOption);
            incidentsForYear.forEach(incident => {
                const option = document.createElement('option');
                option.value = incident;
                option.text = incident;
                incidentSelect.appendChild(option);
            });
            incidentSelect.value = 'All Incidents';
        }
        // initial incident dropdown
        populateIncidentDropdown(yearSelect.value);
        // update incident dropdown on year change
        yearSelect.addEventListener('change', function () {
            populateIncidentDropdown(this.value);
            triggerUpdateMapDropdown();
        });

        const cleanedLabels = {
            DAMAGE: 'Damage',
            CITY: 'City',
            CALFIREUNIT: 'Cal Fire Unit',
            COUNTY: 'County',
            INCIDENTNAME: 'Incident Name',
            STRUCTURETYPE: 'Structure Type',
            STRUCTURECATEGORY: 'Structure Category',
            ROOFCONSTRUCTION: 'Roof Construction',
            EAVES: 'Eaves',
            VENTSCREEN: 'Vent Screen',
            EXTERIORSIDING: 'Exterior Siding',
            WINDOWPANE: 'Window Pane',
            DECKPORCHONGRADE: 'Deck/Porch On Grade',
            PATIOCOVERCARPORT: 'Patio Cover / Carport',
            FENCEATTACHEDTOSTRUCTURE: 'Fence Attached to Structure',
            DECADEBUILT: 'Decade Built',
            ASSESSEDIMPROVEDVALUE: 'Assessed Improved Value',
        };

        const colorFields = ['DAMAGE', 'STRUCTURETYPE', 'STRUCTURECATEGORY', 'ROOFCONSTRUCTION', 'EAVES',
            'VENTSCREEN', 'EXTERIORSIDING', 'WINDOWPANE', 'DECKPORCHONGRADE',
            'PATIOCOVERCARPORT', 'FENCEATTACHEDTOSTRUCTURE',
            'DECADEBUILT'];
        const quantitativeFields = ['ASSESSEDIMPROVEDVALUE'];
        colorFields.forEach(field => {
            const option = document.createElement('option');
            option.value = field;
            option.text = cleanedLabels[field];
            colorFieldSelect.appendChild(option);
        });
        quantitativeFields.forEach(field => {
            const option = document.createElement('option');
            option.value = field;
            option.text = cleanedLabels[field];
            colorFieldSelect.appendChild(option);
        });

        const parallelCatsStringFields = [
            'DAMAGE', 'CITY', 'CALFIREUNIT', 'COUNTY', 'INCIDENTNAME',
            'STRUCTURETYPE', 'STRUCTURECATEGORY', 'ROOFCONSTRUCTION', 'EAVES',
            'VENTSCREEN', 'EXTERIORSIDING', 'WINDOWPANE', 'DECKPORCHONGRADE',
            'PATIOCOVERCARPORT', 'FENCEATTACHEDTOSTRUCTURE',
            'DECADEBUILT'
        ];

        const defaultCats = ['DAMAGE', 'STRUCTURETYPE', 'ROOFCONSTRUCTION'];
        const checkboxesDiv = document.getElementById('parallelCatsCheckboxes');
        checkboxesDiv.innerHTML = '';
        parallelCatsStringFields.forEach(field => {
            const wrap = document.createElement('div');
            wrap.className = 'checkbox-wrap';

            const label = document.createElement('label');
            label.className = 'checkbox-label';
            const checkboxWrapper = document.createElement('div');
            checkboxWrapper.className = 'checkbox-wrapper';
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = field;
            checkbox.checked = defaultCats.includes(field);
            checkbox.className = 'parallel-cats-checkbox';

            // don't add checkbox for DAMAGE
            if (field !== 'DAMAGE') {
                checkboxWrapper.appendChild(checkbox);
                label.appendChild(checkboxWrapper);
                label.appendChild(document.createTextNode(' ' + cleanedLabels[field]));
                wrap.appendChild(label);
                checkboxesDiv.appendChild(label);
            }
        });
        let checkedCats = defaultCats.slice();
        checkboxesDiv.addEventListener('change', (e) => {
            if (e.target.classList.contains('parallel-cats-checkbox')) {
                const val = e.target.value;
                if (e.target.checked) {
                    checkedCats.push(val);
                } else {
                    checkedCats = checkedCats.filter(f => f !== val);
                }
                updateParallelCategoriesPlot(lastFilteredData);
                // enforce max 6 axes
                const checkedCount = checkboxesDiv.querySelectorAll('.parallel-cats-checkbox:checked').length;
                const allCheckboxes = checkboxesDiv.querySelectorAll('.parallel-cats-checkbox');
                allCheckboxes.forEach(cb => {
                    if (!cb.checked) {
                        cb.disabled = checkedCount >= 5;
                    } else {
                        cb.disabled = false;
                    }
                });
            }
        });
        // enforce max 6 axes on load
        function enforceMaxAxesCheckboxes() {
            const checkedCount = checkboxesDiv.querySelectorAll('.parallel-cats-checkbox:checked').length;
            const allCheckboxes = checkboxesDiv.querySelectorAll('.parallel-cats-checkbox');
            allCheckboxes.forEach(cb => {
                if (!cb.checked) {
                    cb.disabled = checkedCount >= 5;
                } else {
                    cb.disabled = false;
                }
            });
        }
        enforceMaxAxesCheckboxes();
        // iterate through checkboxes and add listener to disabled ones
        checkboxesDiv.querySelectorAll('.checkbox-wrapper').forEach(checkboxWrapper => {
            var checkbox = checkboxWrapper.querySelector('input[type="checkbox"]');
            checkboxWrapper.addEventListener('click', (e) => {
                //console.log(checkbox.value)
                if (checkbox.disabled)
                    showMaxAxesPopup();
                //e.preventDefault();
                //e.stopPropagation();
            });
        });
        let lastFilteredData = null;

        // update pie and bar chart
        function updateBarPieChart(filtered_data) {
            if (!filtered_data || !filtered_data.features || filtered_data.features.length === 0) {
                Plotly.purge('barPieChart');
                return;
            }
            const selectedField = colorFieldSelect.value;
            const counts = {};
            const isQuantitative = quantitativeFields.includes(selectedField);
            var validFeatures = filtered_data.features.filter(f => f.properties[selectedField] !== null && f.properties[selectedField] !== undefined);

            let colorScale;
            const gridColor = getGridColor();
            if (isQuantitative) {
                // bin values for quantitative
                const numericValues = validFeatures
                    .map(f => {
                        let v = +f.properties[selectedField];
                        if (!isNaN(v) && v > quantBoundary) v = quantBoundary;
                        return v;
                    })
                    .filter(v => !isNaN(v));
                if (numericValues.length === 0) {
                    Plotly.purge('barPieChart');
                    return;
                }
                const minVal = d3.min(numericValues);
                const maxVal = d3.max(numericValues);
                // create bins for chart
                const binGenerator = d3.bin().domain([minVal, maxVal]).thresholds(10);
                const bins = binGenerator(numericValues);
                // labels for bins
                const binLabels = bins.map(bin => `${bin.x0.toFixed(0)} - ${bin.x1.toFixed(0)}`);
                const binCounts = bins.map(bin => bin.length);
                colorScale = d3.scaleSequential(d3.interpolateViridis).domain([minVal, maxVal]);
                // pie chart data
                const dataPie = [{
                    type: 'pie',
                    labels: binLabels,
                    values: binCounts,
                    textinfo: 'label+percent',
                    hoverinfo: 'label+value+percent',
                    marker: { line: { color: '#fff', width: 1 } },
                    automargin: true
                }];
                // bar chart data
                const dataBar = [{
                    type: 'bar',
                    x: binLabels,
                    y: binCounts,
                    marker: {
                        color: bins.map(bin => colorScale((bin.x0 + bin.x1) / 2)),
                        line: { color: 'black', width: 1 }
                    },
                    automargin: true
                }];
                const layout = {
                    height: 320,
                    margin: { t: 20, l: 10, r: 10, b: 10 },
                    showlegend: false,
                    xaxis: { gridcolor: gridColor, fixedrange: true },
                    yaxis: { gridcolor: gridColor, fixedrange: true }
                };
                const layout2 = {
                    height: 320,
                    margin: { t: 20, l: 25, r: 25, b: 90 }, // further increased bottom margin
                    font: { size: 9 },
                    showlegend: false,
                    xaxis: { gridcolor: gridColor, fixedrange: true, tickangle: -45, automargin: true },
                    yaxis: { gridcolor: gridColor, fixedrange: true }
                };
                if (pieChartButton.classList.contains('active')) {
                    Plotly.react('barPieChart', dataPie, Object.assign({}, layout, isDarkMode() ? { paper_bgcolor: '#23272a', plot_bgcolor: '#23272a', font: { color: '#e0e0e0' } } : {}), { displayModeBar: false });
                } else if (barChartButton.classList.contains('active')) {
                    Plotly.react('barPieChart', dataBar, Object.assign({}, layout2, isDarkMode() ? { paper_bgcolor: '#23272a', plot_bgcolor: '#23272a', font: { color: '#e0e0e0' } } : {}), { displayModeBar: false });
                }
            } else {
                // categorical field for chart
                const uniqueVals = [...new Set(validFeatures.map(f => f.properties[selectedField]))];
                colorScale = d3.scaleOrdinal()
                    .domain(uniqueVals)
                    .range(d3.schemeSet3.concat(d3.schemePastel1).slice(0, uniqueVals.length));
                filtered_data.features.forEach(f => {
                    let val = f.properties[selectedField];
                    if (val === null || val === undefined) val = 'No Data';
                    counts[val] = (counts[val] || 0) + 1;
                });
                const labels = Object.keys(counts);
                const values = labels.map(l => counts[l]);
                const dataPie = [{
                    type: 'pie',
                    labels: labels,
                    values: values,
                    textinfo: 'label+percent',
                    hoverinfo: 'label+value+percent',
                    marker: { line: { color: '#fff', width: 1 } },
                    automargin: true
                }];
                const dataBar = [{
                    type: 'bar',
                    x: labels,
                    y: values,
                    marker: {
                        color: labels.map(label => label === null || label === undefined ? 'black' : colorScale(label)),
                        line: { color: 'black', width: 1 }
                    },
                    automargin: true
                }];
                const layout = {
                    height: 320,
                    margin: { t: 20, l: 10, r: 10, b: 10 },
                    showlegend: false,
                    xaxis: { gridcolor: gridColor, fixedrange: true },
                    yaxis: { gridcolor: gridColor, fixedrange: true }
                };
                const layout2 = {
                    height: 320,
                    margin: { t: 20, l: 25, r: 25, b: 90 }, // further increased bottom margin
                    font: { size: 9 },
                    showlegend: false,
                    xaxis: { gridcolor: gridColor, fixedrange: true, tickangle: -45, automargin: true },
                    yaxis: { gridcolor: gridColor, fixedrange: true }
                };
                if (pieChartButton.classList.contains('active')) {
                    Plotly.react('barPieChart', dataPie, Object.assign({}, layout, isDarkMode() ? { paper_bgcolor: '#23272a', plot_bgcolor: '#23272a', font: { color: '#e0e0e0' } } : {}), { displayModeBar: false });
                } else if (barChartButton.classList.contains('active')) {
                    Plotly.react('barPieChart', dataBar, Object.assign({}, layout2, isDarkMode() ? { paper_bgcolor: '#23272a', plot_bgcolor: '#23272a', font: { color: '#e0e0e0' } } : {}), { displayModeBar: false });
                }
            }
        }

        // update line chart
        function updateLineChart(filtered_data) {
            if (!filtered_data || !filtered_data.features || filtered_data.features.length === 0) {
                Plotly.purge('lineChart');
                return;
            }
            const selectedField = "INCIDENTNAME"; // temp workaround to get single category showing
            // use incident start date or year built
            let timeField = 'INCIDENTSTARTDATE';
            if (!filtered_data.features[0].properties[timeField]) {
                timeField = 'YEARBUILT';
            }
            // parse dates and group by category
            const categoryMap = {};
            filtered_data.features.forEach(f => {
                if (!categoryMap[f.properties[selectedField]]) categoryMap[f.properties[selectedField]] = [];
                categoryMap[f.properties[selectedField]].push(Date.parse(f.properties[timeField]));
            });
            // build cumulative count over time
            const traces = [];
            Object.entries(categoryMap).forEach(([cat, dates]) => {
                // sort dates
                dates.sort((a, b) => a - b);
                // build cumulative
                const dateCounts = {};
                dates.forEach(d => {
                    const key = d;
                    dateCounts[key] = (dateCounts[key] || 0) + 1;
                });
                // build cumulative array
                const sortedKeys = Object.keys(dateCounts).sort();
                let cum = 0;
                const x = [], y = [];
                sortedKeys.forEach(k => {
                    cum += dateCounts[k];
                    x.push(k);
                    y.push(cum);
                });
                traces.push({
                    x, y,
                    mode: 'lines+markers',
                    name: cat,
                    line: { width: 2 }
                });
            });
            const gridColor = getGridColor();
            const layout = {
                height: 320,
                margin: { t: 20, l: 60, r: 10, b: 40 },
                xaxis: { title: { text: 'Date', standoff: 20 }, type: 'date', tickformat: '%m-%d\n%I:%M %p', automargin: true, gridcolor: gridColor, fixedrange: true },
                yaxis: { title: { text: 'Cumulative Count', standoff: 20 }, automargin: true, gridcolor: gridColor, fixedrange: true, rangemode: 'tozero', range: [0, null] },
                showlegend: false
            };
            Plotly.react('lineChart', traces, Object.assign({}, layout, isDarkMode() ? { paper_bgcolor: '#23272a', plot_bgcolor: '#23272a', font: { color: '#e0e0e0' } } : {}), { displayModeBar: false });
        }

        // calculate cramér's v
        function cramersV(x, y) {
            // x and y are arrays of categorical values (strings or numbers)
            // returns cramér's v statistic
            const n = x.length;
            if (n === 0) return 0;
            // get unique values
            const xCats = Array.from(new Set(x));
            const yCats = Array.from(new Set(y));
            // build contingency table
            const table = Array.from({ length: xCats.length }, () => Array(yCats.length).fill(0));
            for (let i = 0; i < n; ++i) {
                const xi = xCats.indexOf(x[i]);
                const yi = yCats.indexOf(y[i]);
                if (xi !== -1 && yi !== -1) table[xi][yi] += 1;
            }
            // row/col sums
            const rowSums = table.map(row => row.reduce((a, b) => a + b, 0));
            const colSums = yCats.map((_, j) => table.reduce((a, row) => a + row[j], 0));
            // expected counts
            const expected = table.map((row, i) =>
                row.map((_, j) => rowSums[i] * colSums[j] / n)
            );
            // chi-squared
            let chi2 = 0;
            for (let i = 0; i < xCats.length; ++i) {
                for (let j = 0; j < yCats.length; ++j) {
                    if (expected[i][j] > 0) {
                        chi2 += Math.pow(table[i][j] - expected[i][j], 2) / expected[i][j];
                    }
                }
            }
            const k = Math.min(xCats.length, yCats.length);
            return Math.sqrt(chi2 / (n * (k - 1)));
        }

        // update cramér's v bar chart
        function updateCramersVBarChart(filtered_data) {
            if (!filtered_data || !filtered_data.features || filtered_data.features.length === 0) {
                Plotly.purge('cramersVBarChart');
                return;
            }
            // add title to bar chart
            const dimensions = checkedCats.length ? checkedCats : defaultCats;
            // only show pairs with damage
            const pairs = [];
            for (let i = 0; i < dimensions.length; ++i) {
                if (dimensions[i] === 'DAMAGE') {
                    for (let j = 0; j < dimensions.length; ++j) {
                        if (i !== j && dimensions[j] !== 'DAMAGE') {
                            pairs.push(['DAMAGE', dimensions[j]]);
                        }
                    }
                }
            }
            const values = pairs.map(([a, b]) => {
                const x = filtered_data.features.map(f => f.properties[a] ?? 'No Data');
                const y = filtered_data.features.map(f => f.properties[b] ?? 'No Data');
                return cramersV(x, y);
            });
            const labels = pairs.map(([a, b]) => `${cleanedLabels[b]}`);
            const gridColor = getGridColor();
            const data = [{
                x: labels,
                y: values,
                type: 'bar',
                marker: { color: '#4a90e2',line: { color: 'black', width: 1 } }
            }];
            const layout = {
                height: 320,
                margin: { t: 20, l: 40, r: 10, b: 100 },
                yaxis: { title: { text: 'Correlation (Cramér\'s V)', font: { size: 11 }}, range: [0, 1], gridcolor: gridColor, fixedrange: true },
                xaxis: { tickangle: -45, gridcolor: gridColor, fixedrange: true }
            };
            Plotly.react('cramersVBarChart', data, Object.assign({}, layout, isDarkMode() ? { paper_bgcolor: '#23272a', plot_bgcolor: '#23272a', font: { color: '#e0e0e0' } } : {}), { displayModeBar: false });
        }

        // update all visualizations
        function updateAllVisualizations(filtered_data) {
            window.currentFilteredData = filtered_data;
            // calculate visible points in map bounds
            let visibleCount = 0;
            if (pointsLayer && map) {
                const bounds = map.getBounds();
                const features = pointsLayer.toGeoJSON().features;
                visibleCount = features.filter(f => {
                    const lat = parseFloat(f.geometry.coordinates[1]);
                    const lng = parseFloat(f.geometry.coordinates[0]);
                    return bounds.contains([lat, lng]);
                }).length;
            } else {
                visibleCount = filtered_data.features.length;
            }
            document.getElementById('pointCount').innerText = `Point(s) Shown: ${visibleCount}`;
            updateParallelCategoriesPlot(filtered_data);
            updateBarPieChart(filtered_data);
            updateLineChart(filtered_data);
            updateCramersVBarChart(filtered_data);
            // show popup if no data
            const checkboxDiv = document.getElementById('parallelCatsCheckboxes');
            if (!filtered_data || !filtered_data.features || filtered_data.features.length === 0 || visibleCount === 0) {
                showNoDataPopup();
                checkboxDiv.style.display = 'none';
            } else {
                checkboxDiv.style.display = '';
            }
        }

        // main update function
        function updateMap() {
            // remove old layers
            if (pointsLayer && map.hasLayer(pointsLayer)) {
                map.removeLayer(pointsLayer);
                pointsLayer = null;
            }
            if (heatmapLayer && map.hasLayer(heatmapLayer)) {
                map.removeLayer(heatmapLayer);
                heatmapLayer = null;
            }

            let filtered_data = {
                ...data,
                features: data.features
            };

            // filter data by year and incident
            filtered_data.features = filtered_data.features.filter(f => f.properties.INCIDENTSTARTYEAR == yearSelect.value);
            if (incidentSelect.value !== 'All Incidents') {
                filtered_data.features = filtered_data.features.filter(
                    f => f.properties.INCIDENTNAME === incidentSelect.value
                );
            }

            const selectedField = colorFieldSelect.value;
            const isQuantitative = quantitativeFields.includes(selectedField);

            var validFeatures = filtered_data.features.filter(f => f.properties[selectedField] !== null && f.properties[selectedField] !== undefined);

            // color scale setup
            let colorScale;
            if (isQuantitative) {
                // use natural log for color scale
                const numericValues = validFeatures
                    .map(f => +f.properties[selectedField])
                    .filter(v => !isNaN(v) && v > 0); // log only defined for v > 0

                const logValues = numericValues.map(v => Math.log(v));
                // remove outliers using percentiles
                function percentile(arr, p) {
                    if (arr.length === 0) return 0;
                    const sorted = arr.slice().sort((a, b) => a - b);
                    const idx = (sorted.length - 1) * p;
                    const lower = Math.floor(idx);
                    const upper = Math.ceil(idx);
                    if (lower === upper) return sorted[lower];
                    return sorted[lower] + (sorted[upper] - sorted[lower]) * (idx - lower);
                }
                const minLog = percentile(logValues, 0.001);
                const maxLog = Math.log(quantBoundary);

                colorScale = d3.scaleSequential(d3.interpolateViridis)
                    .domain([minLog, maxLog]);
            } else {
                const uniqueVals = [...new Set(validFeatures.map(f => f.properties[selectedField]))];
                colorScale = d3.scaleOrdinal()
                    .domain(uniqueVals)
                    .range(d3.schemeSet3.concat(d3.schemePastel1).slice(0, uniqueVals.length));
            }

            // legend setup
            legend.onAdd = function () {
                const div = L.DomUtil.create('div', 'legend');
                div.innerHTML = `<h4>${cleanedLabels[selectedField]}</h4>`;

                if (isQuantitative) {
                    const [minLog, maxLog] = colorScale.domain();
                    const min = Math.exp(minLog);
                    const max = Math.exp(maxLog);
                    div.innerHTML += `
                        <div style="width: 100%; height: 16px; background: linear-gradient(to right, 
                            ${d3.range(0, 1.01, 0.01).map(t => colorScale(t * (maxLog - minLog) + minLog)).join(', ')}); 
                            margin-bottom: 8px; border: 1px solid #ccc; border-radius: 3px;"></div>
                        <div style="display: flex; justify-content: space-between; font-size: 12px; width: 100%;">
                            <span style='overflow: hidden; text-overflow: ellipsis; max-width: 40%;'>${Math.round(min)}</span>
                            <span style='overflow: hidden; text-overflow: ellipsis; text-align: right; max-width: 40%;'>${Math.round(max)}</span>
                        </div>`;
                    div.innerHTML += `<div style='margin-top: 6px; font-size: 11px; color: #888;'>Values above ${Math.round(max)} are capped</div>`;
                    div.innerHTML += `<div style='margin-top: 4px;'><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:black;margin-right:4px;vertical-align:middle;border:1px solid #000;"></span>No data</div>`;
                } else {
                    colorScale.domain().forEach(val => {
                        const color = colorScale(val);
                        div.innerHTML += `
                            <div>
                                <span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${color};margin-right:4px;vertical-align:middle;border:1px solid #000;"></span>
                                ${val}
                            </div>`;
                    });
                    div.innerHTML += `
                        <div>
                            <span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:black;margin-right:4px;vertical-align:middle;border:1px solid #000;"></span>
                            No data
                        </div>`;
                }
                return div;
            };

            // create points layer
            pointsLayer = L.geoJSON(filtered_data, {
                pointToLayer: (feature, latlng) => {
                    const lat = parseFloat(feature.properties.Latitude);
                    const lng = parseFloat(feature.properties.Longitude);
                    const value = feature.properties[selectedField];

                    const color = value === null || value === undefined
                        ? 'black'
                        : isQuantitative
                            ? (value > 0 ? colorScale(Math.log(+value)) : 'black')
                            : colorScale(value);

                    const markerOptions = {
                        radius: 3,
                        fillColor: color,
                        color: "#000",
                        weight: 1,
                        opacity: 1,
                        fillOpacity: 0.8
                    };

                    var str = `<strong>${feature.properties.INCIDENTNAME}</strong><br>${cleanedLabels[selectedField]}: ${value ?? 'null'}`;


                    if (selectedField !== 'DAMAGE')
                        str += `<br>Damage: ${feature.properties.DAMAGE ?? 'null'}`;

                    var returned = L.circleMarker([lat, lng], markerOptions)
                        .bindTooltip(str);

                    return returned;
                }
            });

            // create heatmap layer
            const heatmapData = filtered_data.features.map(f => [
                parseFloat(f.properties.Latitude),
                parseFloat(f.properties.Longitude),
                0.5
            ]);

            heatmapLayer = L.heatLayer(heatmapData, {
                radius: 8,
                blur: 5,
                maxZoom: 10,
                max: 2.5,
                gradient: {
                    0.1: 'blue',
                    0.2: '#4575b4',
                    0.3: '#74add1',
                    0.4: '#abd9e9',
                    0.5: '#e0f3f8',
                    0.6: '#fee090',
                    0.7: '#fdae61',
                    0.8: '#f46d43',
                    0.9: '#d73027',
                    1.0: 'red'
                }
            });

            // add correct layer to map
            if (heatmapButton.classList.contains('active')) {
                heatmapLayer.addTo(map);
                map.removeControl(legend);
            } else {
                pointsLayer.addTo(map);
                map.addControl(legend);
            }

            // update all visualizations
            updateAllVisualizations(filtered_data);
            lastFilteredData = filtered_data;
            // fit map to bounds if needed
            if (filtered_data.features.length > 0) {
                const latlngs = filtered_data.features.map(f => [
                    +f.properties.Latitude,
                    +f.properties.Longitude
                ]);
                const bounds = L.latLngBounds(latlngs);
                if (updateMap.cause === 'dropdown') {
                    map.fitBounds(bounds, { padding: [30, 30] });
                } else if (updateMap.cause === 'colorField') {
                    // check if there are 0 points visible
                    let visibleCount = 0;
                    if (pointsLayer && map) {
                        const mapBounds = map.getBounds();
                        const features = pointsLayer.toGeoJSON().features;
                        visibleCount = features.filter(f => {
                            const lat = parseFloat(f.geometry.coordinates[1]);
                            const lng = parseFloat(f.geometry.coordinates[0]);
                            return mapBounds.contains([lat, lng]);
                        }).length;
                    }
                    // if no points are visible, reset view
                    if (visibleCount === 0) {
                        map.fitBounds(bounds, { padding: [30, 30] });
                    }
                }
            }

            // cleanup large arrays
            filtered_data = null;
            validFeatures = null;
            visibleFeatures = null;
        }

        // update parallel categories plot
        function updateParallelCategoriesPlot(filtered_data) {
            const plotDiv = document.getElementById('parallelCatsPlot');
            if (!filtered_data || !filtered_data.features || filtered_data.features.length === 0) {
                plotDiv.style.display = 'none';
                Plotly.purge('parallelCatsPlot');
                return;
            }
            plotDiv.style.display = '';
            const dimensions = checkedCats.length ? checkedCats : defaultCats;
            const plotData = {};
            dimensions.forEach(dim => plotData[dim] = []);
            filtered_data.features.forEach(f => {
                dimensions.forEach(dim => {
                    let rep = f.properties[dim] ?? "No Data";
                    if (rep.length > parCatRectLabelLength / dimensions.length) rep = rep.substring(0, parCatRectLabelLength / dimensions.length) + '...';
                    plotData[dim].push(rep);
                });
            });
            // sort categories for each axis
            const plotlyDimensions = dimensions.map(dim => {
                const uniqueCats = Array.from(new Set(plotData[dim])).sort((a, b) => String(a).localeCompare(String(b)));
                return {
                    label: cleanedLabels[dim] || dim,
                    values: plotData[dim],
                    categoryorder: 'array',
                    categoryarray: uniqueCats
                };
            });
            const data = [{
                type: 'parcats',
                dimensions: plotlyDimensions,
                line: {
                    color: '#4a90e2',
                    shape: 'hspline'
                },
                //arrangement: 'fixed' // prevent axis reordering
            }];
            const layout = {
                height: 400,
                yaxis: {
                    automargin: true
                },
                font: { size: 12 }
            };
            Plotly.react('parallelCatsPlot', data, Object.assign({}, layout, isDarkMode() ? { paper_bgcolor: '#23272a', plot_bgcolor: '#23272a', font: { color: '#e0e0e0' } } : {}), { displayModeBar: false });
            // also update cramér's v bar chart
            updateCramersVBarChart(filtered_data);
        }

        // handle dropdown changes
        function triggerUpdateMapDropdown() {
            updateMap.cause = 'dropdown';
            updateMap();
            updateMap.cause = undefined;
        }
        function triggerUpdateMapColorField() {
            updateMap.cause = 'colorField';
            updateMap();
            updateMap.cause = undefined;
        }
        // add event listeners
        incidentSelect.addEventListener('change', triggerUpdateMapDropdown);
        colorFieldSelect.addEventListener('change', function () {
            const selectedField = this.value;
            const checkboxes = checkboxesDiv.querySelectorAll('.parallel-cats-checkbox');
            let selectedCheckbox = null;
            checkboxes.forEach(cb => {
                if (cb.value === selectedField) selectedCheckbox = cb;
            });
            if (selectedCheckbox) {
                if (selectedCheckbox.disabled) {
                    // find and remove the second column from the left (not DAMAGE)
                    const enabledCheckboxes = Array.from(checkboxes).filter(cb => cb.checked && cb.value !== 'DAMAGE');
                    if (enabledCheckboxes.length > 0) {
                        // find the second checked checkbox (first is DAMAGE)
                        const toRemove = enabledCheckboxes[0];
                        toRemove.checked = false;
                        checkedCats = checkedCats.filter(f => f !== toRemove.value);
                        // re-enable it
                        toRemove.disabled = false;
                    }
                }
                // check the selected checkbox if not already
                if (!selectedCheckbox.checked) {
                    selectedCheckbox.checked = true;
                    if (!checkedCats.includes(selectedField)) checkedCats.push(selectedField);
                }
                // enforce max axes
                const checkedCount = checkboxesDiv.querySelectorAll('.parallel-cats-checkbox:checked').length;
                checkboxes.forEach(cb => {
                    if (!cb.checked) {
                        cb.disabled = checkedCount >= 5;
                    } else {
                        cb.disabled = false;
                    }
                });
                updateParallelCategoriesPlot(lastFilteredData);
            }
            updateMap.cause = 'colorField';
            updateMap();
            updateMap.cause = undefined;
        });
        // update plot on map move
        map.on('moveend', () => {
            if (pointsLayer) {
                const bounds = map.getBounds();
                const visibleFeatures = pointsLayer.toGeoJSON().features.filter(f => {
                    const lat = parseFloat(f.geometry.coordinates[1]);
                    const lng = parseFloat(f.geometry.coordinates[0]);
                    return bounds.contains([lat, lng]);
                });
                const visibleData = { type: "FeatureCollection", features: visibleFeatures };
                updateAllVisualizations(visibleData);
            }
        });

        // points/heatmap button listeners
        pointsButton.addEventListener('click', () => {
            pointsButton.classList.add('active');
            heatmapButton.classList.remove('active');
            if (heatmapLayer) map.removeLayer(heatmapLayer);
            if (pointsLayer) map.addLayer(pointsLayer);
            map.addControl(legend);
        });

        heatmapButton.addEventListener('click', () => {
            heatmapButton.classList.add('active');
            pointsButton.classList.remove('active');
            if (pointsLayer) map.removeLayer(pointsLayer);
            if (heatmapLayer) map.addLayer(heatmapLayer);
            map.removeControl(legend);
        });

        // pie/bar chart button listeners
        pieChartButton.addEventListener('click', function () {
            pieChartButton.classList.add('active');
            barChartButton.classList.remove('active');
            updateBarPieChart(window.currentFilteredData);
        });

        barChartButton.addEventListener('click', function () {
            barChartButton.classList.add('active');
            pieChartButton.classList.remove('active');
            updateBarPieChart(window.currentFilteredData);
        });

        // initial map update
        updateMap();
        for (let item of document.getElementsByClassName("js-plotly-plot")) 
        { 
            if (item.style.width.substring(0, 1) !== '1') 
                item.style.width = parseInt(item.style.width.substring(0, 3)) + 
                    16 + item.style.width.substring(3) ;
        };
    })
    .catch(error => console.error('Error loading GeoJSON:', error));

// helper: convert to sentence case
function toSentenceCase(str) {
    return str
        .replace(/([A-Z])/g, '$1')
        .trim()
        .toLowerCase()
        .replace(/^./, s => s.toUpperCase());
}

// show a temporary popup if no data points are visible
function showNoDataPopup() {
    let popup = document.getElementById('noDataPopup');
    if (!popup) {
        popup = document.createElement('div');
        popup.id = 'noDataPopup';
        popup.style.position = 'fixed';
        popup.style.top = '30px';
        popup.style.left = '50%';
        popup.style.transform = 'translateX(-50%)';
        popup.style.padding = '18px 32px';
        popup.style.fontSize = '1.2em';
        popup.style.borderRadius = '8px';
        popup.style.zIndex = 9999;
        popup.style.boxShadow = '0 2px 12px rgba(0,0,0,0.15)';
        popup.innerText = 'No data points visible in this view.';
        document.body.appendChild(popup);
    }
    // set popup style based on dark mode
    if (isDarkMode()) {
        popup.style.background = '#23272a';
        popup.style.color = '#e0e0e0';
        popup.style.border = '2px solid #4a90e2';
    } else {
        popup.style.background = 'rgba(255,255,255,0.95)';
        popup.style.color = '#d73027';
        popup.style.border = '2px solid #d73027';
    }
    popup.style.display = 'block';
    popup.style.opacity = '1';
    popup.style.transition = 'opacity 0.8s';
    setTimeout(() => {
        popup.style.opacity = '0';
        setTimeout(() => { popup.style.display = 'none'; }, 800);
    }, 3000);
}

// show a popup if max axes selected
function showMaxAxesPopup() {
    let popup = document.getElementById('maxAxesPopup');
    if (!popup) {
        popup = document.createElement('div');
        popup.id = 'maxAxesPopup';
        popup.style.position = 'fixed';
        popup.style.top = '30px';
        popup.style.left = '50%';
        popup.style.transform = 'translateX(-50%)';
        popup.style.padding = '18px 32px';
        popup.style.fontSize = '1.2em';
        popup.style.borderRadius = '8px';
        popup.style.zIndex = 9999;
        popup.style.boxShadow = '0 2px 12px rgba(0,0,0,0.15)';
        popup.innerText = 'Maximum 5 axes can be selected.';
        document.body.appendChild(popup);
    }
    if (isDarkMode()) {
        popup.style.background = '#23272a';
        popup.style.color = '#e0e0e0';
        popup.style.border = '2px solid #4a90e2';
    } else {
        popup.style.background = 'rgba(255,255,255,0.95)';
        popup.style.color = '#d73027';
        popup.style.border = '2px solid #d73027';
    }
    popup.style.display = 'block';
    popup.style.opacity = '1';
    popup.style.transition = 'opacity 0.8s';
    setTimeout(() => {
        popup.style.opacity = '0';
        setTimeout(() => { popup.style.display = 'none'; }, 800);
    }, 3000);
}

// helper to get current grid color
function getGridColor() {
    return isDarkMode() ? '#444' : '#ddd';
}

// set leaflet tile background on mode change
function setLeafletTileFillerColor() {
    var color = isDarkMode() ? '#23272a' : '#f0f0f0';
    document.querySelectorAll('.leaflet-tile').forEach(tile => {
        tile.style.background = color;
    });
}

// call on map load and mode change
map.on('layeradd', setLeafletTileFillerColor);
if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', setLeafletTileFillerColor);
}

// global variable for current filtered data
window.currentFilteredData = null;

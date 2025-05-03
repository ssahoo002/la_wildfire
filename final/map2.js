// init map
const map = L.map('map').setView([34.0522, -118.2437], 10);

// add tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// legend control
const legend = L.control({ position: 'topright' });

// layer variables
let pointsLayer;
let heatmapLayer;

// ui element references
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

// Load all files in parallel
Promise.all(files.map(f => d3.json(f)))
    .then(datasets => {
        // Merge all features into one array
        const allFeatures = datasets.flatMap(d => d.features);
        // Create a single GeoJSON FeatureCollection
        const data = {
            type: "FeatureCollection",
            features: allFeatures
        };
        // --- Build year dropdown ---
        const years = [...new Set(data.features.map(f => f.properties.INCIDENTSTARTYEAR))].filter(y => y).sort((a, b) => b - a);
        yearSelect.innerHTML = '';
        years.forEach(year => {
            const option = document.createElement('option');
            option.value = year;
            option.text = year;
            yearSelect.appendChild(option);
        });
        // Set default year to 2025 if present
        if (years.includes(2025)) yearSelect.value = 2025;
        // --- Build incident dropdown for selected year ---
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
        // Initial population
        populateIncidentDropdown(yearSelect.value);
        // Update incident dropdown when year changes
        yearSelect.addEventListener('change', function () {
            populateIncidentDropdown(this.value);
            triggerUpdateMapDropdown();
        });

        const colorFields = ['DAMAGE', 'STRUCTURETYPE', 'STRUCTURECATEGORY', 'ROOFCONSTRUCTION', 'EAVES',
            'VENTSCREEN', 'EXTERIORSIDING', 'WINDOWPANE', 'DECKPORCHONGRADE',
            'PATIOCOVERCARPORT', 'FENCEATTACHEDTOSTRUCTURE',
            'DECADEBUILT'];
        const quantitativeFields = ['ASSESSEDIMPROVEDVALUE'];
        colorFields.forEach(field => {
            const option = document.createElement('option');
            option.value = field;
            option.text = toSentenceCase(field);
            colorFieldSelect.appendChild(option);
        });
        quantitativeFields.forEach(field => {
            const option = document.createElement('option');
            option.value = field;
            option.text = toSentenceCase(field);
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
            const label = document.createElement('label');
            label.style.marginRight = '10px';
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = field;
            checkbox.checked = defaultCats.includes(field);
            checkbox.className = 'parallel-cats-checkbox';
            // always show Damage, disable its checkbox
            if (field === 'DAMAGE') {
                checkbox.checked = true;
                checkbox.disabled = true;
            }
            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(' ' + toSentenceCase(field)));
            checkboxesDiv.appendChild(label);
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
            }
        });
        let lastFilteredData = null;

        // --- Pie + Bar Chart ---
        function updateBarPieChart(filtered_data) {
            if (!filtered_data || !filtered_data.features || filtered_data.features.length === 0) {
                Plotly.purge('pieChart');
                return;
            }
            const selectedField = colorFieldSelect.value;
            const counts = {};
            const isQuantitative = quantitativeFields.includes(selectedField);
            var validFeatures = filtered_data.features.filter(f => f.properties[selectedField] !== null && f.properties[selectedField] !== undefined);


            let colorScale;
            if (isQuantitative) {
                const numericValues = validFeatures
                    .map(f => +f.properties[selectedField])
                    .filter(v => !isNaN(v));

                const minVal = d3.min(numericValues);
                const maxVal = d3.max(numericValues);

                colorScale = d3.scaleSequential(d3.interpolateViridis)
                    .domain([minVal, maxVal]);
            } else {
                const uniqueVals = [...new Set(validFeatures.map(f => f.properties[selectedField]))];
                colorScale = d3.scaleOrdinal()
                    .domain(uniqueVals)
                    .range(d3.schemeSet3.concat(d3.schemePastel1).slice(0, uniqueVals.length));
            }

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
                textinfo: 'label+percent',
                hoverinfo: 'label+value+percent',
                marker: {
                    color: labels.map(label => label === null || label === undefined ? 'black' : isQuantitative ? colorScale(+label) : colorScale(label)),
                    line: { color: 'black', width: 1 }
                },
                // marker: { line: { color: '#fff', width: 1 } },
                automargin: true
            }]

            const layout = {
                height: 320,
                margin: { t: 20, l: 10, r: 10, b: 10 },
                showlegend: false,
                // automargin: true
            };

            const layout2 = {
                height: 320,
                margin: { t: 20, l: 25, r: 25, b: 50 },
                font: {
                    size: 9
                },
                showlegend: false,
                // automargin: true
            };
            if (pieChartButton.classList.contains('active')) {
                Plotly.react('pieChart', dataPie, layout, { displayModeBar: false });
            } else if (barChartButton.classList.contains('active')) {
                Plotly.react('pieChart', dataBar, layout2, { displayModeBar: false });
            }
        }

        // --- Cumulative Line Chart ---
        function updateLineChart(filtered_data) {
            if (!filtered_data || !filtered_data.features || filtered_data.features.length === 0) {
                Plotly.purge('lineChart');
                return;
            }
            const selectedField = "INCIDENTNAME"; // temp workaround to get single category showing
            // Use INCIDENTSTARTDATE or YEARBUILT as time axis if available
            let timeField = 'INCIDENTSTARTDATE';
            if (!filtered_data.features[0].properties[timeField]) {
                timeField = 'YEARBUILT';
            }
            // Parse dates and group by category
            const categoryMap = {};
            filtered_data.features.forEach(f => {
                if (!categoryMap[f.properties[selectedField]]) categoryMap[f.properties[selectedField]] = [];
                categoryMap[f.properties[selectedField]].push(Date.parse(f.properties[timeField]));
                /*let cat = f.properties[selectedField];
                if (cat === null || cat === undefined) cat = 'No Data';
                let t = f.properties[timeField];
                if (!t) return;
                // Try to parse as date or year
                let date;
                if (typeof t === 'string' && t.match(/^\d{4}-\d{2}-\d{2}/)) {
                    date = new Date(t);
                } else if (!isNaN(+t)) {
                    date = new Date(+t, 0, 1);
                } else {
                    return;
                }
                if (!categoryMap[cat]) categoryMap[cat] = [];
                categoryMap[cat].push(date);*/
            });
            // For each category, build cumulative count over time
            const traces = [];
            Object.entries(categoryMap).forEach(([cat, dates]) => {
                // Sort dates
                dates.sort((a, b) => a - b);
                // Build cumulative
                const dateCounts = {};
                dates.forEach(d => {
                    const key = d;/*.toISOString().slice(0, 10);*/
                    dateCounts[key] = (dateCounts[key] || 0) + 1;
                });
                // Build cumulative array
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
            const layout = {
                height: 320,
                margin: { t: 20, l: 60, r: 10, b: 60 },
                xaxis: { title: { text: 'Date', standoff: 20 }, type: 'date', tickformat: '%m-%d\n%I:%M %p', automargin: true },
                yaxis: { title: { text: 'Cumulative Count', standoff: 20 }, automargin: true },
                showlegend: false
            };
            Plotly.react('lineChart', traces, layout, { displayModeBar: false });
        }

        // --- Cramér's V Bar Chart ---
        function cramersV(x, y) {
            // x and y are arrays of categorical values (strings or numbers)
            // Returns Cramér's V statistic
            const n = x.length;
            if (n === 0) return 0;
            // Get unique values
            const xCats = Array.from(new Set(x));
            const yCats = Array.from(new Set(y));
            // Build contingency table
            const table = Array.from({ length: xCats.length }, () => Array(yCats.length).fill(0));
            for (let i = 0; i < n; ++i) {
                const xi = xCats.indexOf(x[i]);
                const yi = yCats.indexOf(y[i]);
                if (xi !== -1 && yi !== -1) table[xi][yi] += 1;
            }
            // Row/col sums
            const rowSums = table.map(row => row.reduce((a, b) => a + b, 0));
            const colSums = yCats.map((_, j) => table.reduce((a, row) => a + row[j], 0));
            // Expected counts
            const expected = table.map((row, i) =>
                row.map((_, j) => rowSums[i] * colSums[j] / n)
            );
            // Chi-squared
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

        function updateCramersVBarChart(filtered_data) {
            if (!filtered_data || !filtered_data.features || filtered_data.features.length === 0) {
                Plotly.purge('cramersVBarChart');
                return;
            }
            // add title to bar chart
            const dimensions = checkedCats.length ? checkedCats : defaultCats;
            // Only show pairs where one is DAMAGE and the other is not DAMAGE
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
            const labels = pairs.map(([a, b]) => `${toSentenceCase(b)}`);
            const data = [{
                x: labels,
                y: values,
                type: 'bar',
                marker: { color: '#4a90e2' }
            }];
            const layout = {
                height: 320,
                margin: { t: 50, l: 40, r: 10, b: 80 },
                yaxis: { title: "Cramér's V", range: [0, 1] },
                xaxis: { tickangle: -45, automargin: true },
                title: { text: 'Correlation between damage and...', font: { size: 18 }, xref: 'container', x: 0.5 }
            };
            Plotly.react('cramersVBarChart', data, layout, { displayModeBar: false });
        }

        // --- Update all visualizations on map/filter changes ---
        function updateAllVisualizations(filtered_data) {
            window.currentFilteredData = filtered_data;
            updateParallelCategoriesPlot(filtered_data);
            updateBarPieChart(filtered_data);
            updateLineChart(filtered_data);
            updateCramersVBarChart(filtered_data);
            // show popup if no data
            if (!filtered_data || !filtered_data.features || filtered_data.features.length === 0) {
                showNoDataPopup();
                document.getElementById('parallelCatsCheckboxes').hidden = true;
            } else {
                document.getElementById('parallelCatsCheckboxes').hidden = false;
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
                const numericValues = validFeatures
                    .map(f => +f.properties[selectedField])
                    .filter(v => !isNaN(v));

                const minVal = d3.min(numericValues);
                const maxVal = d3.max(numericValues);

                colorScale = d3.scaleSequential(d3.interpolateViridis)
                    .domain([minVal, maxVal]);

            } else {
                const uniqueVals = [...new Set(validFeatures.map(f => f.properties[selectedField]))];
                colorScale = d3.scaleOrdinal()
                    .domain(uniqueVals)
                    .range(d3.schemeSet3.concat(d3.schemePastel1).slice(0, uniqueVals.length));
            }

            // legend setup
            legend.onAdd = function () {
                const div = L.DomUtil.create('div', 'legend');
                div.innerHTML = `<h4>${selectedField}</h4>`;

                if (isQuantitative) {
                    const [min, max] = colorScale.domain();
                    div.innerHTML += `
                        <div style="width: 120px; height: 12px; background: linear-gradient(to right, 
                            ${d3.range(0, 1.01, 0.1).map(t => colorScale(t * (max - min) + min)).join(', ')}); 
                            margin-bottom: 6px; border: 1px solid #ccc;"></div>
                        <div style="display: flex; justify-content: space-between; font-size: 12px;">
                            <span>${Math.round(min)}</span><span>${Math.round(max)}</span>
                        </div>`;
                } else {
                    colorScale.domain().forEach(val => {
                        const color = colorScale(val);
                        div.innerHTML += `
                            <div>
                                <span style="background:${color}"></span>
                                ${val}
                            </div>`;
                    });
                }

                div.innerHTML += `
                    <div>
                        <span style="background:black"></span>
                        No data
                    </div>`;

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
                            ? colorScale(+value)
                            : colorScale(value);

                    const markerOptions = {
                        radius: 3,
                        fillColor: color,
                        color: "#000",
                        weight: 1,
                        opacity: 1,
                        fillOpacity: 0.8
                    };

                    var str = `<strong>${feature.properties.INCIDENTNAME}</strong><br>${selectedField}: ${value ?? 'null'}`;


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
                if (
                    updateMap.cause === 'dropdown' ||
                    (updateMap.cause === 'colorField')
                ) {
                    map.fitBounds(bounds, { padding: [30, 30] });
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
                    plotData[dim].push(f.properties[dim] ?? "No Data");
                });
            });
            const plotlyDimensions = dimensions.map(dim => ({
                label: dim,
                values: plotData[dim]
            }));
            const data = [{
                type: 'parcats',
                dimensions: plotlyDimensions,
                line: {
                    color: 'blue',
                    shape: 'hspline'
                }
            }];
            const layout = {
                height: 400,
                // margin: { t: 30, l: 20, r: 20, b: 40 },
                yaxis: {
                    automargin: true
                },
                font: { size: 12 }
            };
            Plotly.react('parallelCatsPlot', data, layout, { displayModeBar: false });
            // Also update Cramér's V bar chart to reflect current columns
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
        colorFieldSelect.addEventListener('change', triggerUpdateMapColorField);
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
        // DELETE THIS LATER
        /*let filtered_data = {
            ...data,
            features: data.features
        };

        // filter data by incident
        if (incidentSelect.value === '2025 Incidents') {
            filtered_data.features = filtered_data.features.filter(f => f.properties.INCIDENTSTARTYEAR === 2025);
        } else {
            filtered_data.features = filtered_data.features.filter(
                f => f.properties.INCIDENTNAME === incidentSelect.value
            );
        }*/

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
        popup.style.background = 'rgba(255,255,255,0.95)';
        popup.style.border = '2px solid #d73027';
        popup.style.color = '#d73027';
        popup.style.padding = '18px 32px';
        popup.style.fontSize = '1.2em';
        popup.style.borderRadius = '8px';
        popup.style.zIndex = 9999;
        popup.style.boxShadow = '0 2px 12px rgba(0,0,0,0.15)';
        popup.innerText = 'No data points visible in this view.';
        document.body.appendChild(popup);
    }
    popup.style.display = 'block';
    setTimeout(() => { popup.style.display = 'none'; }, 2200);
}

// global variable for current filtered data
window.currentFilteredData = null;

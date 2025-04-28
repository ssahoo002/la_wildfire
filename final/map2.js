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
const incidentSelect = document.getElementById('incidentSelect');
const colorFieldSelect = document.getElementById('colorFieldSelect');

// load geojson data
d3.json('structure_data_filtered.geojson')
    .then(data => {
        let incidents = [...new Set(data.features.map(f => f.properties.INCIDENTNAME))];
        incidents = incidents.filter(i => i !== 'Eaton' && i !== 'Palisades' && i !== 'All Incidents');
        incidents.sort();
        incidents = ['Eaton', 'Palisades', ...incidents];
        incidents.forEach(incident => {
            const option = document.createElement('option');
            option.value = incident;
            option.text = incident;
            incidentSelect.appendChild(option);
        });

        const colorFields = ['DAMAGE', 'STRUCTURETYPE', 'STREETTYPE', 'CALFIREUNIT', 'STRUCTURECATEGORY', 'ROOFCONSTRUCTION', 'EXTERIORSIDING', 'YEARBUILT'];
        const quantitativeFields = ['YEARBUILT'];
        colorFields.forEach(field => {
            const option = document.createElement('option');
            option.value = field;
            option.text = toSentenceCase(field);
            colorFieldSelect.appendChild(option);
        });

        const parallelCatsStringFields = [
            'DAMAGE', 'CITY', 'CALFIREUNIT', 'COUNTY', 'INCIDENTNAME',
            'STRUCTURETYPE', 'STRUCTURECATEGORY', 'ROOFCONSTRUCTION', 'EAVES',
            'VENTSCREEN', 'EXTERIORSIDING', 'WINDOWPANE', 'DECKPORCHONGRADE',
            'PATIOCOVERCARPORT', 'FENCEATTACHEDTOSTRUCTURE', 'FIRENAME'
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

            // filter data by incident
            if (incidentSelect.value === '2025 Incidents') {
                filtered_data.features = filtered_data.features.filter(f => f.properties.INCIDENTSTARTYEAR === 2025);
            } else {
                filtered_data.features = filtered_data.features.filter(
                    f => f.properties.INCIDENTNAME === incidentSelect.value
                );
            }

            const selectedField = colorFieldSelect.value;
            const isQuantitative = quantitativeFields.includes(selectedField);

            const validFeatures = filtered_data.features.filter(f => f.properties[selectedField] !== null && f.properties[selectedField] !== undefined);

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

                    return L.circleMarker([lat, lng], markerOptions)
                        .bindTooltip(`<strong>${feature.properties.INCIDENTNAME}</strong><br>${selectedField}: ${value ?? 'null'}`);
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

            // update parallel categories plot
            updateParallelCategoriesPlot(filtered_data);
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
                    (updateMap.cause === 'colorField' && sampledFeatures.length === 0)
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
            if (!filtered_data || !filtered_data.features || filtered_data.features.length === 0) return;
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
                margin: { t: 30, l: 20, r: 20, b: 40 },
                font: { size: 12 }
            };
            Plotly.react('parallelCatsPlot', data, layout, { displayModeBar: false });
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

                updateParallelCategoriesPlot({ type: "FeatureCollection", features: visibleFeatures });
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

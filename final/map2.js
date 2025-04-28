// center of LA
const map = L.map('map').setView([34.0522, -118.2437], 10);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

const legend = L.control({ position: 'topright' });

let pointsLayer;
let heatmapLayer;

const pointsButton = document.getElementById('pointsButton');
const heatmapButton = document.getElementById('heatmapButton');
const incidentSelect = document.getElementById('incidentSelect');
const colorFieldSelect = document.getElementById('colorFieldSelect');

// GeoJSON data
d3.json('structure_data_filtered.geojson')
    .then(data => {
        // Custom sort: Eaton, Palisades at top, All Incidents at bottom
        let incidents = [...new Set(data.features.map(f => f.properties.INCIDENTNAME))];
        incidents = incidents.filter(i => i !== 'Eaton' && i !== 'Palisades' && i !== 'All Incidents');
        incidents.sort();
        incidents = ['Eaton', 'Palisades', ...incidents, 'All Incidents'];
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

        // String attributes except date for parallel categories checkboxes
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
        // Track order of checked fields
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
        // Store last filtered data for checkbox updates
        let lastFilteredData = null;

        function updateMap() {
            if (pointsLayer && map.hasLayer(pointsLayer)) map.removeLayer(pointsLayer);
            if (heatmapLayer && map.hasLayer(heatmapLayer)) map.removeLayer(heatmapLayer);

            let filtered_data = {
                ...data,
                features: data.features
            };

            if (incidentSelect.value === '2025 Incidents') { filtered_data.features = filtered_data.features.filter(f => f.properties.INCIDENTSTARTYEAR === 2025); }
            else if (incidentSelect.value !== 'All Incidents') {
                filtered_data.features = filtered_data.features.filter(
                    f => f.properties.INCIDENTNAME === incidentSelect.value
                );
            }

            const selectedField = colorFieldSelect.value;
            const isQuantitative = quantitativeFields.includes(selectedField);

            // null filter
            const validFeatures = filtered_data.features.filter(f => f.properties[selectedField] !== null && f.properties[selectedField] !== undefined);

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

                // null black
                div.innerHTML += `
                    <div>
                        <span style="background:black"></span>
                        No data
                    </div>`;

                return div;
            };

            // Points layer
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

            // Heatmap layer
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

            if (heatmapButton.classList.contains('active')) {
                heatmapLayer.addTo(map);
                map.removeControl(legend);
            } else {
                pointsLayer.addTo(map);
                map.addControl(legend);
            }

            updateParallelCategoriesPlot(filtered_data);
            lastFilteredData = filtered_data;

            if (filtered_data.features.length > 0) {
                const meanLat = d3.mean(filtered_data.features, f => +f.properties.Latitude);
                const meanLng = d3.mean(filtered_data.features, f => +f.properties.Longitude);
                map.setView([meanLat, meanLng], 10);
            }
        }

        function updateParallelCategoriesPlot(filtered_data) {
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

        incidentSelect.addEventListener('change', updateMap);
        colorFieldSelect.addEventListener('change', updateMap);

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

        updateMap();
    })
    .catch(error => console.error('Error loading GeoJSON:', error));

function toSentenceCase(str) {
    return str
        .replace(/([A-Z])/g, '$1')
        .trim()
        .toLowerCase()
        .replace(/^./, s => s.toUpperCase());
}

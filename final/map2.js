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
d3.json('structure_data.geojson')
    .then(data => {
        const incidents = [...new Set(data.features.map(f => f.properties.INCIDENTNAME))].sort();
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
            option.text = field;
            colorFieldSelect.appendChild(option);
        });

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

            updateScatterPlot(filtered_data);

            if (filtered_data.features.length > 0) {
                const meanLat = d3.mean(filtered_data.features, f => +f.properties.Latitude);
                const meanLng = d3.mean(filtered_data.features, f => +f.properties.Longitude);
                map.setView([meanLat, meanLng], 10);
            }
        }

        function updateScatterPlot(filtered_data) {
            const svg = d3.select("#scatterPlot");
            const margin = { top: 20, right: 20, bottom: 40, left: 40 };
            const width = svg.attr("width") - margin.left - margin.right;
            const height = svg.attr("height") - margin.top - margin.bottom;

            // Clear existing plot
            svg.selectAll("*").remove();

            // Set up the plot area
            const g = svg.append("g")
                .attr("transform", `translate(${margin.left},${margin.top})`);

            // X and Y scales
            const x = d3.scaleLinear()
                .domain(d3.extent(filtered_data.features, d => +d.properties.YEARBUILT))
                .range([0, width]);

            const y = d3.scaleLinear()
                .domain(d3.extent(filtered_data.features, d => +d.properties.ASSESSEDIMPROVEDVALUE))
                .range([height, 0]);

            const selectedField = colorFieldSelect.value;

            // Add the scatter plot points
            const points = g.selectAll(".dot")
                .data(filtered_data.features)
                .enter().append("g")
                .attr("class", "dot-group")
                .attr("transform", d => `translate(${x(+d.properties.YEARBUILT)},${y(+d.properties.ASSESSEDIMPROVEDVALUE)})`)
                .on("mouseover", function (event, d) {
                    // Show label on hover
                    d3.select(this).select(".label-box").style("visibility", "visible");
                    d3.select(this).select(".label-text").style("visibility", "visible");
                })
                .on("mouseout", function (event, d) {
                    // Hide label when not hovering
                    d3.select(this).select(".label-box").style("visibility", "hidden");
                    d3.select(this).select(".label-text").style("visibility", "hidden");
                });

            // Add the circle
            points.append("circle")
                .attr("r", 5)
                .style("fill", "#4a90e2")
                .style("opacity", 0.7);

            // Add the background box for the label (rect element)
            points.append("rect")
                .attr("class", "label-box")
                .attr("x", 10)
                .attr("y", -20)
                .attr("rx", 5)
                .attr("ry", 5)
                .attr("width", 180)
                .attr("height", 30)
                .style("fill", "white")
                .style("stroke", "#ccc")
                .style("stroke-width", 1)
                .style("visibility", "hidden")
                .style("box-shadow", "2px 2px 5px rgba(0, 0, 0, 0.1)");

            // Add the label text inside the box
            points.append("text")
                .attr("class", "label-text")
                .attr("x", 15)
                .attr("y", -5)
                .style("font-size", "12px")
                .style("font-family", "Arial, sans-serif")
                .style("fill", "#333")
                .style("visibility", "hidden")
                .text(function (d) {
                    const incn = d.properties.INCIDENTNAME || 'Unknown Incident';
                    const selectedValue = d.properties[selectedField] || 'No Value';
                    return `${incn}: (${selectedField}: ${selectedValue})`;
                });

            // Add X axis
            g.append("g")
                .attr("transform", `translate(0,${height})`)
                .call(d3.axisBottom(x));

            // Add Y axis
            g.append("g")
                .call(d3.axisLeft(y));

            // Add axis labels
            g.append("text")
                .attr("x", width / 2)
                .attr("y", height + 35)
                .style("text-anchor", "middle")
                .text("YEAR BUILT");

            g.append("text")
                .attr("transform", "rotate(-90)")
                .attr("y", -40)
                .attr("x", -height / 2)
                .style("text-anchor", "middle")
                .text("ASSESSED IMPROVED VALUE");
        }




        // Event listeners
        incidentSelect.addEventListener('change', updateMap);
        colorFieldSelect.addEventListener('change', updateMap);

        // update scatter with every zoom
        map.on('moveend', () => {
            if (pointsLayer) {
                const bounds = map.getBounds();
                const visibleFeatures = pointsLayer.toGeoJSON().features.filter(f => {
                    const lat = parseFloat(f.geometry.coordinates[1]);
                    const lng = parseFloat(f.geometry.coordinates[0]);
                    return bounds.contains([lat, lng]);
                });

                updateScatterPlot({ type: "FeatureCollection", features: visibleFeatures });
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

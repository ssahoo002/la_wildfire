// center of LA
const map = L.map('map').setView([34.0522, -118.2437], 10);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

const legend = L.control({position: 'topright'});

legend.onAdd = function (map) {
    const div = L.DomUtil.create('div', 'legend');
    const damageColors = {
        'No Damage': '#1a9850',
        'Affected (1-9%)': '#91cf60',
        'Minor (10-25%)': '#fee08b',
        'Major (26-50%)': '#fc8d59',
        'Destroyed (>50%)': '#d73027',
        'Inaccessible': '#808080'
    };

    div.innerHTML = '<h4>Damage Level</h4>';
    Object.entries(damageColors).forEach(([label, color]) => {
        div.innerHTML += `
            <div>
                <span style="background:${color}"></span>
                ${label}
            </div>`;
    });
    return div;
};

let pointsLayer;
let heatmapLayer;

const pointsButton = document.getElementById('pointsButton');
const heatmapButton = document.getElementById('heatmapButton');

// geojson data
d3.json('structure_data.geojson')
    .then(data => {
        const incidentSelect = document.getElementById('incidentSelect');
        const damageChecked = document.getElementById('damage');
        
        // incident names for dropdown
        const incidents = [...new Set(data.features.map(f => f.properties.INCIDENTNAME))].sort();
        incidents.forEach(incident => {
            const option = document.createElement('option');
            option.value = incident;
            option.text = incident;
            incidentSelect.appendChild(option);
        });

        const damages = [...new Set(data.features.map(f => f.properties.DAMAGE
        ))].sort();

        console.log(damages)

        console.log(incidentSelect.value);
        console.log(damageChecked.checked);
        // update map with filters and radio buttons
        function updateMap() {
            if (pointsLayer && map.hasLayer(pointsLayer)) {
                map.removeLayer(pointsLayer);
            }
            if (heatmapLayer && map.hasLayer(heatmapLayer)) {
                map.removeLayer(heatmapLayer);
            }
            var filtered_data = {
                ...data,
                features: data.features.filter(feature => 
                    feature.properties.INCIDENTSTARTYEAR === 2025)
            };
            if (incidentSelect.value !== 'All Incidents') {
                filtered_data = {
                    ...data,
                    features: data.features.filter(feature => 
                        feature.properties.INCIDENTNAME === incidentSelect.value)
                };
            }

            console.log(filtered_data);

            // color for damage levels
            const damageColors = {
                'No Damage': '#1a9850',        // green
                'Affected (1-9%)': '#91cf60',  // light green
                'Minor (10-25%)': '#fee08b',   // yellow
                'Major (26-50%)': '#fc8d59',   // orange
                'Destroyed (>50%)': '#d73027', // red
                'Inaccessible': '#808080'      // gray
            };
            
            // points layer
            pointsLayer = L.geoJSON(filtered_data, {
                pointToLayer: (feature, latlng) => {
                    const lat = parseFloat(feature.properties.Latitude);
                    const lng = parseFloat(feature.properties.Longitude); 
                    
                    const markerOptions = {
                        radius: 2,
                        fillColor: damageChecked.checked ? 
                            damageColors[feature.properties.DAMAGE] || '#000000' :
                            "#ff7800", // orange default
                        color: "#000",
                        weight: 1,
                        opacity: 1,
                        fillOpacity: 0.8
                    };
            
                    return L.circleMarker([lat, lng], markerOptions);
                }
            });

            // heatmap layer
            const heatmapData = filtered_data.features.map(feature => {
                const lat = parseFloat(feature.properties.Latitude);
                const lng = parseFloat(feature.properties.Longitude);
                return [lat, lng, 0.5];
            });

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
                if (damageChecked.checked) {
                    map.addControl(legend);
                } else {
                    map.removeControl(legend);
                }
            }
        
            // center map on filtered data
            if (filtered_data.features.length > 0) {
                const meanLat = filtered_data.features.reduce((sum, feature) => 
                    sum + parseFloat(feature.properties.Latitude), 0) / filtered_data.features.length;
                const meanLng = filtered_data.features.reduce((sum, feature) => 
                    sum + parseFloat(feature.properties.Longitude), 0) / filtered_data.features.length;
                
                console.log("Mean center:", meanLat, meanLng);
                map.setView([meanLat, meanLng], 10);
            }
        }

        // event listeners
        incidentSelect.addEventListener('change', updateMap);
        damageChecked.addEventListener('change', updateMap);
        pointsButton.addEventListener('click', () => {
            pointsButton.classList.add('active');
            heatmapButton.classList.remove('active');
            map.removeLayer(heatmapLayer);
            map.addLayer(pointsLayer);
        });

        heatmapButton.addEventListener('click', () => {
            heatmapButton.classList.add('active');
            pointsButton.classList.remove('active');
            map.removeLayer(pointsLayer);
            map.addLayer(heatmapLayer);
        });

        updateMap();
        map.addLayer(heatmapLayer);

    })
    .catch(error => console.error('Error loading GeoJSON:', error));
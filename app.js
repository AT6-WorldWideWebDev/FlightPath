// Simple in-memory store for areas
const areas = [];

// Loading transition
window.addEventListener("load", () => {
    setTimeout(() => {
        const loading = document.getElementById("loading-screen");
        const app = document.getElementById("app");
        if (loading) loading.style.display = "none";
        if (app) app.style.display = "block";
    }, 2600);
});

// Initialize map once DOM is ready
document.addEventListener("DOMContentLoaded", () => {
    const statusEl = document.getElementById("status");
    const areasListEl = document.getElementById("areas-list");

    if (statusEl) {
        statusEl.textContent = "Use the drawing tools on the map to mark areas that need cutting.";
    }

    // Center on Toronto for now; change to your yard later if you want
    const map = L.map('map').setView([43.6532, -79.3832], 18);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 22
    }).addTo(map);

    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);

    const drawControl = new L.Control.Draw({
        edit: {
            featureGroup: drawnItems
        },
        draw: {
            polygon: true,
            rectangle: true,
            circle: false,
            marker: false,
            polyline: false
        }
    });
    map.addControl(drawControl);

    // When a new shape is created
    map.on(L.Draw.Event.CREATED, function (event) {
        const layer = event.layer;

        const level = prompt("Cutting level (1–7):");
        const numericLevel = Number(level);

        if (!level || isNaN(numericLevel) || numericLevel < 1 || numericLevel > 7) {
            alert("Invalid level. Please enter a number from 1 to 7.");
            return;
        }

        // Style the shape based on level
        const color = getLevelColor(numericLevel);
        layer.setStyle({
            color: color,
            fillColor: color,
            fillOpacity: 0.4
        });

        drawnItems.addLayer(layer);

        const id = Date.now();
        const shapeData = layer.toGeoJSON();
        shapeData.properties = {
            id,
            level: numericLevel
        };

        areas.push({
            id,
            level: numericLevel,
            layer,
            geojson: shapeData
        });

        if (statusEl) {
            statusEl.textContent = `Area saved with cutting level ${numericLevel}.`;
        }

        renderAreasList(areasListEl, areas, map);
    });
});

// Map level to color
function getLevelColor(level) {
    if (level <= 2) return "#8be28b";      // light green
    if (level <= 4) return "#c7e26b";      // yellow-green
    if (level <= 6) return "#f2c46b";      // orange
    return "#f28b7b";                      // red
}

// Render the sidebar list of areas
function renderAreasList(listEl, areas, map) {
    if (!listEl) return;

    listEl.innerHTML = "";

    if (areas.length === 0) {
        const li = document.createElement("li");
        li.className = "empty";
        li.textContent = "No areas yet. Draw on the map to add one.";
        listEl.appendChild(li);
        return;
    }

    areas.forEach(area => {
        const li = document.createElement("li");

        const label = document.createElement("span");
        label.textContent = `Level ${area.level}`;
        label.className = "area-level";

        const idSpan = document.createElement("span");
        idSpan.textContent = `#${area.id.toString().slice(-4)}`;
        idSpan.className = "area-id";

        li.appendChild(label);
        li.appendChild(idSpan);

        li.addEventListener("click", () => {
            const bounds = area.layer.getBounds();
            map.fitBounds(bounds, { padding: [20, 20] });
        });

        listEl.appendChild(li);
    });
}

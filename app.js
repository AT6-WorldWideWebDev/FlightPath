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
    if (!statusEl) return;

    statusEl.textContent = "Use the drawing tools on the map to mark areas that need cutting.";

    // Center on Toronto for now; you can change to your yard coords later
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

    map.on(L.Draw.Event.CREATED, function (event) {
        const layer = event.layer;
        drawnItems.addLayer(layer);

        const level = prompt("Cutting level (1–7):");
        const numericLevel = Number(level);

        if (!level || isNaN(numericLevel) || numericLevel < 1 || numericLevel > 7) {
            alert("Invalid level. Please enter a number from 1 to 7.");
            drawnItems.removeLayer(layer);
            return;
        }

        const shapeData = layer.toGeoJSON();
        shapeData.properties = {
            level: numericLevel
        };

        statusEl.textContent = `Area saved with cutting level ${numericLevel}. Saving…`;

        saveShapeToGitHub(shapeData)
            .then(() => {
                statusEl.textContent = `Area saved with cutting level ${numericLevel}.`;
            })
            .catch(err => {
                console.error(err);
                statusEl.textContent = "There was a problem saving this area.";
            });
    });
});

// Sends the drawn shape to your GitHub Action
async function saveShapeToGitHub(shape) {
    // IMPORTANT:
    // 1. Replace YOURNAME with your GitHub username
    // 2. Replace YOUR_TOKEN with a GitHub token (or move this call to a backend)
    //    Never expose a real long‑lived token in production.
    const response = await fetch("https://api.github.com/repos/YOURNAME/FlightPath/dispatches", {
        method: "POST",
        headers: {
            "Accept": "application/vnd.github+json",
            "Authorization": "Bearer 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"
        },
        body: JSON.stringify({
            event_type: "new-ticket",
            client_payload: {
                id: Date.now(),
                type: "cutting-area",
                shape: shape,
                timestamp: new Date().toISOString()
            }
        })
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error("GitHub API error: " + text);
    }
}

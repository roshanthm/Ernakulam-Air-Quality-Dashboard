// Data
const wardsData = [
    { name: 'Fort Kochi', aqi: 65, status: 'Moderate', trend: 'down' },
    { name: 'Marine Drive', aqi: 52, status: 'Moderate', trend: 'down' },
    { name: 'Edappally', aqi: 112, status: 'Poor', trend: 'up' },
    { name: 'Kakkanad', aqi: 98, status: 'Moderate', trend: 'stable' },
    { name: 'Palarivattom', aqi: 105, status: 'Poor', trend: 'up' },
    { name: 'Vyttila', aqi: 89, status: 'Moderate', trend: 'stable' },
];

const monitoringStations = [
    { id: 1, name: 'Fort Kochi Station', position: [9.9658, 76.2428], aqi: 65, status: 'Moderate', type: 'traffic' },
    { id: 2, name: 'Marine Drive Station', position: [9.9674, 76.2816], aqi: 52, status: 'Moderate', type: 'residential' },
    { id: 3, name: 'Edappally Junction', position: [10.0246, 76.3083], aqi: 112, status: 'Poor', type: 'traffic' },
    { id: 4, name: 'Kakkanad IT Park', position: [10.0067, 76.3500], aqi: 98, status: 'Moderate', type: 'industrial' },
    { id: 5, name: 'Palarivattom', position: [9.9951, 76.3127], aqi: 105, status: 'Poor', type: 'traffic' },
    { id: 6, name: 'Vyttila Junction', position: [9.9678, 76.3160], aqi: 89, status: 'Moderate', type: 'traffic' },
    { id: 7, name: 'Ernakulam South', position: [9.9588, 76.2906], aqi: 71, status: 'Moderate', type: 'residential' },
    { id: 8, name: 'Kadavanthra', position: [9.9713, 76.2965], aqi: 78, status: 'Moderate', type: 'residential' },
];

const pollutantData = [
    { name: 'PM2.5', value: 35, color: '#3b82f6' },
    { name: 'PM10', value: 28, color: '#8b5cf6' },
    { name: 'NO2', value: 18, color: '#ef4444' },
    { name: 'SO2', value: 12, color: '#f59e0b' },
    { name: 'CO', value: 7, color: '#10b981' },
];

// Helper Functions
function getStatusColor(status) {
    const colors = {
        'Good': 'aqi-good',
        'Moderate': 'aqi-moderate',
        'Poor': 'aqi-poor',
        'Very Poor': 'aqi-very-poor',
        'Severe': 'aqi-severe'
    };
    return colors[status] || 'aqi-moderate';
}

function getTrendIcon(trend) {
    const icons = {
        'up': '<i class="fas fa-arrow-trend-up" style="color: #dc2626;"></i>',
        'down': '<i class="fas fa-arrow-trend-down" style="color: #10b981;"></i>',
        'stable': '<i class="fas fa-minus" style="color: #64748b;"></i>'
    };
    return icons[trend] || icons.stable;
}

function getMarkerColor(aqi) {
    if (aqi <= 50) return '#22c55e';
    if (aqi <= 100) return '#eab308';
    if (aqi <= 200) return '#f97316';
    if (aqi <= 300) return '#ef4444';
    return '#9333ea';
}

// Navigation
document.addEventListener('DOMContentLoaded', () => {
    const navTabs = document.querySelectorAll('.nav-tab');
    const tabContents = document.querySelectorAll('.tab-content');
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const navigation = document.getElementById('navigation');

    navTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.getAttribute('data-tab');
            
            // Update active tab
            navTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Update active content
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === targetTab) {
                    content.classList.add('active');
                }
            });

            // Close mobile menu
            if (window.innerWidth <= 768) {
                navigation.classList.add('hidden');
                mobileMenuBtn.querySelector('i').className = 'fas fa-bars';
            }
        });
    });

    // Mobile menu toggle
    mobileMenuBtn.addEventListener('click', () => {
        navigation.classList.toggle('hidden');
        const icon = mobileMenuBtn.querySelector('i');
        icon.className = navigation.classList.contains('hidden') ? 'fas fa-bars' : 'fas fa-times';
    });

    // Initialize components
    renderWardGrid();
    renderMap();
    renderStationGrid();
    renderPollutantBars();
    initializeCharts();
});

// Render Ward Grid
function renderWardGrid() {
    const wardGrid = document.getElementById('wardGrid');
    wardGrid.innerHTML = wardsData.map(ward => `
        <div class="ward-card">
            <div class="ward-header">
                <h3>${ward.name}</h3>
                <div class="trend-icon">${getTrendIcon(ward.trend)}</div>
            </div>
            <div class="ward-aqi-value">
                <span>${ward.aqi}</span>
                <span>AQI</span>
            </div>
            <span class="aqi-badge ${getStatusColor(ward.status)}">${ward.status}</span>
        </div>
    `).join('');
}

// Map Rendering
function renderMap() {
    const svg = document.getElementById('mapSvg');
    const allLats = monitoringStations.map(s => s.position[0]);
    const allLngs = monitoringStations.map(s => s.position[1]);
    
    const bounds = {
        minLat: Math.min(...allLats) - 0.02,
        maxLat: Math.max(...allLats) + 0.02,
        minLng: Math.min(...allLngs) - 0.02,
        maxLng: Math.max(...allLngs) + 0.02,
    };

    // Add grid pattern
    svg.innerHTML = `
        <defs>
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#e2e8f0" stroke-width="0.2"/>
            </pattern>
            <filter id="glow">
                <feGaussianBlur stdDeviation="0.5" result="coloredBlur"/>
                <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
            </filter>
        </defs>
        <rect width="100" height="100" fill="url(#grid)" />
    `;

    // Add ward zones
    const wardZones = [
        { name: 'Fort Kochi', lat: 9.9658, lng: 76.2428, aqi: 65 },
        { name: 'Marine Drive', lat: 9.9674, lng: 76.2816, aqi: 52 },
        { name: 'Edappally', lat: 10.0246, lng: 76.3083, aqi: 112 },
        { name: 'Kakkanad', lat: 10.0067, lng: 76.3500, aqi: 98 },
    ];

    wardZones.forEach(ward => {
        const { x, y } = latLngToXY(ward.lat, ward.lng, bounds);
        const color = getMarkerColor(ward.aqi);
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', x);
        circle.setAttribute('cy', y);
        circle.setAttribute('r', '8');
        circle.setAttribute('fill', color);
        circle.setAttribute('opacity', '0.2');
        circle.setAttribute('stroke', color);
        circle.setAttribute('stroke-width', '0.3');
        circle.setAttribute('filter', 'url(#glow)');
        svg.appendChild(circle);

        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', x);
        text.setAttribute('y', y + 12);
        text.setAttribute('font-size', '2.5');
        text.setAttribute('fill', '#475569');
        text.setAttribute('text-anchor', 'middle');
        text.textContent = ward.name;
        svg.appendChild(text);
    });

    // Add monitoring stations
    monitoringStations.forEach(station => {
        const { x, y } = latLngToXY(station.position[0], station.position[1], bounds);
        const color = getMarkerColor(station.aqi);
        
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', x);
        circle.setAttribute('cy', y);
        circle.setAttribute('r', '2');
        circle.setAttribute('fill', color);
        circle.setAttribute('stroke', 'white');
        circle.setAttribute('stroke-width', '0.4');
        circle.setAttribute('filter', 'url(#glow)');
        circle.style.cursor = 'pointer';
        
        circle.addEventListener('click', () => showStationDetails(station));
        svg.appendChild(circle);
    });
}

function latLngToXY(lat, lng, bounds) {
    const x = ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * 100;
    const y = ((bounds.maxLat - lat) / (bounds.maxLat - bounds.minLat)) * 100;
    return { x, y };
}

function showStationDetails(station) {
    const detailsDiv = document.getElementById('stationDetails');
    const color = getMarkerColor(station.aqi);
    
    detailsDiv.innerHTML = `
        <div style="display: flex; align-items: start; gap: 0.75rem; margin-bottom: 1rem;">
            <div style="background: var(--emerald-100); padding: 0.5rem; border-radius: 0.75rem;">
                <i class="fas fa-map-marker-alt" style="color: var(--emerald-600);"></i>
            </div>
            <div style="flex: 1;">
                <p style="color: var(--slate-900); font-weight: 600; margin-bottom: 0.25rem;">${station.name}</p>
                <p style="color: var(--slate-600); font-size: 0.75rem; text-transform: capitalize;">${station.type} Zone</p>
            </div>
            <button onclick="hideStationDetails()" style="background: none; border: none; color: var(--slate-400); cursor: pointer; font-size: 1.25rem;">✕</button>
        </div>
        <div style="border-top: 2px solid var(--slate-100); padding-top: 1rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                <span style="color: var(--slate-600); font-size: 0.875rem;">Current AQI:</span>
                <span style="color: var(--slate-900); font-size: 1.5rem; font-weight: bold;">${station.aqi}</span>
            </div>
            <span style="display: inline-block; padding: 0.5rem 1rem; border-radius: 0.75rem; font-size: 0.875rem; border: 2px solid ${color}; background-color: ${color}20; color: ${color};">
                ${station.status}
            </span>
        </div>
    `;
    
    detailsDiv.classList.remove('hidden');
    updateStationSelection(station.id);
}

function hideStationDetails() {
    document.getElementById('stationDetails').classList.add('hidden');
    updateStationSelection(null);
}

// Station Grid
function renderStationGrid(filter = 'all') {
    const filteredStations = filter === 'all' 
        ? monitoringStations 
        : monitoringStations.filter(s => s.type === filter);
    
    const stationGrid = document.getElementById('stationGrid');
    const stationCount = document.getElementById('stationCount');
    
    stationCount.textContent = `(${filteredStations.length})`;
    
    stationGrid.innerHTML = filteredStations.map(station => `
        <div class="station-item" data-station-id="${station.id}" onclick="showStationDetails(${JSON.stringify(station).replace(/"/g, '&quot;')})">
            <div style="display: flex; gap: 0.75rem; margin-bottom: 0.75rem;">
                <div style="width: 1.25rem; height: 1.25rem; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.2); background-color: ${getMarkerColor(station.aqi)};"></div>
                <div style="flex: 1;">
                    <h4 style="color: var(--slate-900); font-size: 0.95rem; margin-bottom: 0.25rem;">${station.name}</h4>
                    <p style="color: var(--slate-600); font-size: 0.8rem; text-transform: capitalize;">${station.type}</p>
                </div>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 0.75rem; border-top: 2px solid var(--slate-100);">
                <span style="color: var(--slate-600); font-size: 0.875rem;">AQI</span>
                <span style="color: var(--slate-900); font-size: 1.25rem; font-weight: 600;">${station.aqi}</span>
            </div>
        </div>
    `).join('');
}

function updateStationSelection(selectedId) {
    document.querySelectorAll('.station-item').forEach(item => {
        if (selectedId && item.getAttribute('data-station-id') == selectedId) {
            item.classList.add('selected');
        } else {
            item.classList.remove('selected');
        }
    });
}

// Zone Filter
document.addEventListener('DOMContentLoaded', () => {
    const zoneFilter = document.getElementById('zoneFilter');
    if (zoneFilter) {
        zoneFilter.addEventListener('change', (e) => {
            renderStationGrid(e.target.value);
        });
    }
});

// Pollutant Bars
function renderPollutantBars() {
    const container = document.getElementById('pollutantBars');
    if (!container) return;
    
    container.innerHTML = pollutantData.map(pollutant => `
        <div class="pollutant-bar">
            <div class="pollutant-header">
                <span class="pollutant-name">${pollutant.name}</span>
                <span class="pollutant-value">${pollutant.value}%</span>
            </div>
            <div class="pollutant-progress">
                <div class="pollutant-fill" style="width: ${pollutant.value}%; background-color: ${pollutant.color};"></div>
            </div>
        </div>
    `).join('');
}

// Charts
let aqiTrendChart, pmComparisonChart, wardComparisonChart;

function initializeCharts() {
    initAQITrendChart();
    initPMComparisonChart();
    initWardComparisonChart();
    
    // Time range selector
    const timeRange = document.getElementById('timeRange');
    if (timeRange) {
        timeRange.addEventListener('change', (e) => {
            updateCharts(e.target.value);
        });
    }
}

function initAQITrendChart() {
    const ctx = document.getElementById('aqiTrendChart');
    if (!ctx) return;
    
    const dailyData = [
        { time: '00:00', aqi: 65 },
        { time: '03:00', aqi: 58 },
        { time: '06:00', aqi: 72 },
        { time: '09:00', aqi: 95 },
        { time: '12:00', aqi: 105 },
        { time: '15:00', aqi: 98 },
        { time: '18:00', aqi: 112 },
        { time: '21:00', aqi: 89 },
    ];
    
    aqiTrendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dailyData.map(d => d.time),
            datasets: [{
                label: 'AQI',
                data: dailyData.map(d => d.aqi),
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: false
                }
            }
        }
    });
}

function initPMComparisonChart() {
    const ctx = document.getElementById('pmComparisonChart');
    if (!ctx) return;
    
    const dailyData = [
        { time: '00:00', pm25: 32, pm10: 58 },
        { time: '03:00', pm25: 28, pm10: 52 },
        { time: '06:00', pm25: 38, pm10: 68 },
        { time: '09:00', pm25: 48, pm10: 89 },
        { time: '12:00', pm25: 55, pm10: 98 },
        { time: '15:00', pm25: 52, pm10: 92 },
        { time: '18:00', pm25: 58, pm10: 105 },
        { time: '21:00', pm25: 45, pm10: 82 },
    ];
    
    pmComparisonChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dailyData.map(d => d.time),
            datasets: [
                {
                    label: 'PM2.5 (μg/m³)',
                    data: dailyData.map(d => d.pm25),
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    pointRadius: 5
                },
                {
                    label: 'PM10 (μg/m³)',
                    data: dailyData.map(d => d.pm10),
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    pointRadius: 5
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                }
            },
            scales: {
                y: {
                    beginAtZero: false
                }
            }
        }
    });
}

function initWardComparisonChart() {
    const ctx = document.getElementById('wardComparisonChart');
    if (!ctx) return;
    
    const weeklyData = {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        fortKochi: [65, 58, 72, 68, 75, 62, 55],
        marineDrive: [52, 48, 55, 51, 58, 49, 45],
        edappally: [112, 105, 118, 108, 125, 98, 89],
        kakkanad: [98, 92, 102, 95, 105, 88, 82]
    };
    
    wardComparisonChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: weeklyData.labels,
            datasets: [
                {
                    label: 'Fort Kochi',
                    data: weeklyData.fortKochi,
                    backgroundColor: '#3b82f6',
                    borderRadius: 8
                },
                {
                    label: 'Marine Drive',
                    data: weeklyData.marineDrive,
                    backgroundColor: '#10b981',
                    borderRadius: 8
                },
                {
                    label: 'Edappally',
                    data: weeklyData.edappally,
                    backgroundColor: '#f59e0b',
                    borderRadius: 8
                },
                {
                    label: 'Kakkanad',
                    data: weeklyData.kakkanad,
                    backgroundColor: '#8b5cf6',
                    borderRadius: 8
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                }
            },
            scales: {
                y: {
                    beginAtZero: false
                }
            }
        }
    });
}

function updateCharts(timeRange) {
    // Update chart data based on time range
    console.log('Updating charts for:', timeRange);
    // Implementation for different time ranges would go here
}

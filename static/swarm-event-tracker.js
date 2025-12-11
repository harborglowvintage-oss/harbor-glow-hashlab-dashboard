// Swarm Event Tracker - Chart.js bubble timeline
(function () {
    const EVENT_STYLES = {
        reboot: { label: 'Reboot', color: '#00eaff', size: 10 },
        drop: { label: 'Hash Drop', color: '#ff5171', size: 11 },
        hot: { label: 'Hot Temp', color: '#ffae42', size: 12 },
        weather: { label: 'Weather', color: '#7dd3ff', size: 9 }
    };

    const sampleEvents = [
        { timestamp: offsetMinutes(-240), minerId: 'Miner A', type: 'reboot' },
        { timestamp: offsetMinutes(-185), minerId: 'Miner C', type: 'drop' },
        { timestamp: offsetMinutes(-170), minerId: 'Miner F', type: 'hot' },
        { timestamp: offsetMinutes(-160), minerId: 'Miner B', type: 'drop' },
        { timestamp: offsetMinutes(-140), minerId: 'Miner G', type: 'weather' },
        { timestamp: offsetMinutes(-120), minerId: 'Miner A', type: 'hot' },
        { timestamp: offsetMinutes(-90), minerId: 'Miner D', type: 'drop' },
        { timestamp: offsetMinutes(-55), minerId: 'Miner F', type: 'reboot' },
        { timestamp: offsetMinutes(-40), minerId: 'Miner H', type: 'weather' },
        { timestamp: offsetMinutes(-25), minerId: 'Miner C', type: 'hot' },
        { timestamp: offsetMinutes(-15), minerId: 'Miner B', type: 'drop' },
        { timestamp: offsetMinutes(-5), minerId: 'Miner E', type: 'reboot' },
        { timestamp: offsetMinutes(-2), minerId: 'Miner G', type: 'hot' }
    ];

    let chartInstance = null;

    function offsetMinutes(delta) {
        return Date.now() + delta * 60 * 1000;
    }

    function formatTick(value) {
        return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    function groupByType(events) {
        const grouped = {};
        events.forEach((event) => {
            if (!EVENT_STYLES[event.type]) {
                return;
            }
            grouped[event.type] = grouped[event.type] || [];
            grouped[event.type].push(event);
        });
        return grouped;
    }

    function renderChart(events, { label = 'Sample Feed' } = {}) {
        const canvas = document.getElementById('swarm-event-chart');
        const status = document.getElementById('swarm-event-status');
        if (!canvas || !window.Chart) {
            return;
        }
        status && (status.textContent = label);

        const ctx = canvas.getContext('2d');
        const minerOrder = Array.from(new Set(events.map((event) => event.minerId)));
        const grouped = groupByType(events);

        const datasets = Object.entries(grouped).map(([type, items]) => {
            const style = EVENT_STYLES[type];
            return {
                label: style.label,
                data: items.map((event) => ({
                    x: event.timestamp,
                    y: event.minerId,
                    r: style.size
                })),
                backgroundColor: style.color,
                borderWidth: 0,
                hoverBackgroundColor: style.color
            };
        });

        if (chartInstance) {
            chartInstance.destroy();
        }

        chartInstance = new Chart(ctx, {
            type: 'bubble',
            data: { datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'nearest', intersect: false },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label(context) {
                                const data = context.raw;
                                const type = context.dataset.label;
                                return `${type} • ${data.y} • ${formatTick(data.x)}`;
                            }
                        },
                        backgroundColor: 'rgba(10,10,18,0.9)',
                        borderColor: 'rgba(0,255,255,0.4)',
                        borderWidth: 1,
                        titleColor: '#fff',
                        bodyColor: '#e3f6ff'
                    }
                },
                scales: {
                    x: {
                        type: 'linear',
                        ticks: {
                            callback: formatTick,
                            color: '#8dbdff'
                        },
                        grid: {
                            color: 'rgba(0,255,255,0.08)',
                            borderDash: [4, 4]
                        },
                        title: {
                            display: true,
                            text: 'Time (recent events)',
                            color: '#cde9ff',
                            font: { size: 12 }
                        }
                    },
                    y: {
                        type: 'category',
                        labels: minerOrder,
                        ticks: {
                            color: '#8dbdff'
                        },
                        grid: {
                            color: 'rgba(0,255,255,0.05)'
                        },
                        title: {
                            display: true,
                            text: 'Miner',
                            color: '#cde9ff',
                            font: { size: 12 }
                        }
                    }
                }
            }
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        renderChart(sampleEvents);
    });

    window.updateSwarmEventTracker = function (events, meta = {}) {
        const payload = Array.isArray(events) && events.length ? events : sampleEvents;
        renderChart(payload, meta);
    };
})();

let socket;
let chart;
let chartData = {};
let selectedCoin = 'ethusdt';
let selectedInterval = '1m';
let reconnectInterval = 5000;  // Try reconnecting after 5 seconds if disconnected

// Initialize the chart
function initializeChart() {
    const ctx = document.getElementById('myChart').getContext('2d');
    chart = new Chart(ctx, {
        type: 'candlestick',
        data: {
            datasets: [{
                label: 'Candlestick Chart',
                data: chartData[selectedCoin] || []
            }]
        },
        options: {
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'minute'
                    }
                }
            }
        }
    });
}

// Update the chart with new data
function updateChart(newData) {
    if (!chartData[selectedCoin]) {
        chartData[selectedCoin] = [];
    }
    chartData[selectedCoin].push(newData);

    chart.data.datasets[0].data = chartData[selectedCoin];
    chart.update();

    // Persist data in local storage
    localStorage.setItem(`${selectedCoin}ChartData`, JSON.stringify(chartData[selectedCoin]));
}

// Format Binance kline data for Chart.js candlestick format
function formatKlineData(kline) {
    return {
        t: kline.t, // Timestamp
        o: kline.o, // Open price
        h: kline.h, // High price
        l: kline.l, // Low price
        c: kline.c, // Close price
    };
}

// Fetch the WebSocket data and update the chart
function startWebSocket() {
    // Close the previous WebSocket connection if it exists
    if (socket) {
        socket.close();
    }

    const wsUrl = `wss://stream.binance.com:9443/ws/${selectedCoin}@kline_${selectedInterval}`;
    socket = new WebSocket(wsUrl);

    socket.onopen = function() {
        console.log('WebSocket connected.');
    };

    socket.onmessage = function(event) {
        const data = JSON.parse(event.data);
        const kline = data.k;

        if (kline.x) { // Only process closed candles
            const formattedData = formatKlineData(kline);
            updateChart(formattedData);
        }
    };

    socket.onclose = function() {
        console.log('WebSocket connection closed. Attempting to reconnect in 5 seconds...');
        setTimeout(startWebSocket, reconnectInterval);  // Try reconnecting after 5 seconds
    };

    socket.onerror = function(error) {
        console.error('WebSocket error: ', error);
    };
}

// Restore previous chart data from local storage
function restorePreviousData() {
    const storedData = localStorage.getItem(`${selectedCoin}ChartData`);
    if (storedData) {
        chartData[selectedCoin] = JSON.parse(storedData);
        chart.data.datasets[0].data = chartData[selectedCoin];
        chart.update();
    }
}

// Initialize the app
function initializeApp() {
    initializeChart();
    restorePreviousData();
    startWebSocket();

    document.getElementById('coin-select').addEventListener('change', function(event) {
        selectedCoin = event.target.value;
        restorePreviousData();
        startWebSocket();
    });

    document.getElementById('interval-select').addEventListener('change', function(event) {
        selectedInterval = event.target.value;
        startWebSocket();
    });
}

initializeApp();

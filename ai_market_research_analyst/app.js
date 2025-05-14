// SPA dynamic content loading for AI Market Research Analyst

document.addEventListener('DOMContentLoaded', () => {
    const mainContent = document.getElementById('mainContent');
    const navLinks = document.querySelectorAll('nav a');
    const uploadBtn = document.getElementById('uploadBtn');
    const csvFileInput = document.getElementById('csvFileInput');

    // Page initialization functions
    const pageInitFunctions = {
        'data_preview.html': initDataPreview,
        'data_summary.html': initDataSummary,
        'data_visualization.html': initDataVisualization,
        'summary_report_generation.html': initSummaryReportGeneration,
        'report_download.html': initReportDownload
    };

    // Function to load page content dynamically
    async function loadPage(page) {
        try {
            const response = await fetch(page);
            if (!response.ok) {
                mainContent.innerHTML = `<p>Error loading page: ${page}</p>`;
                return;
            }
            let text = await response.text();

            // Extract only the content inside <body> tags to load
            const bodyContentMatch = text.match(/<body[^>]*>((.|[\n\r])*)<\/body>/im);
            if (bodyContentMatch && bodyContentMatch.length > 1) {
                text = bodyContentMatch[1];

                // Remove header, nav, and upload button from loaded content if present
                text = text.replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '');
                text = text.replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '');
                text = text.replace(/<button[^>]*id=["']uploadBtn["'][^>]*>[\s\S]*?<\/button>/gi, '');
                text = text.replace(/<input[^>]*id=["']csvFileInput["'][^>]*>/gi, '');
            }

            mainContent.innerHTML = text;

            // Execute page-specific initialization function if exists
            if (pageInitFunctions[page]) {
                pageInitFunctions[page]();
            }
        } catch (error) {
            mainContent.innerHTML = `<p>Error loading page: ${error.message}</p>`;
        }
    }

    // Load default page on initial load
    loadPage('data_preview.html');

    // Handle navigation link clicks
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.getAttribute('data-page');
            if (page) {
                loadPage(page);
                // Update active link styling
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            }
        });
    });

    // Upload button functionality
    uploadBtn.addEventListener('click', () => {
        csvFileInput.click();
    });

    csvFileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: function(results) {
                    localStorage.setItem('csvData', JSON.stringify(results.data));
                    alert('CSV file uploaded and parsed successfully!');
                    // Reload current page content to reflect new data
                    const activeLink = document.querySelector('nav a.active');
                    if (activeLink) {
                        loadPage(activeLink.getAttribute('data-page'));
                    } else {
                        loadPage('data_preview.html');
                    }
                },
                error: function(err) {
                    alert('Error parsing CSV file: ' + err.message);
                }
            });
        }
    });

    // Page-specific initialization functions

    function initDataPreview() {
        const container = document.getElementById('previewTableContainer');
        if (!container) return;

        const csvData = localStorage.getItem('csvData');
        if (!csvData) {
            container.innerHTML = '<p>No CSV data uploaded yet. Please upload a CSV file on the Home page.</p>';
            return;
        }
        const data = JSON.parse(csvData);
        if (data.length === 0) {
            container.innerHTML = '<p>Uploaded CSV file is empty.</p>';
            return;
        }

        function renderTable(data) {
            container.innerHTML = '';
            if (!data || data.length === 0) {
                container.innerHTML = '<p>Uploaded CSV file is empty.</p>';
                return;
            }
            const table = document.createElement('table');
            table.style.width = '100%';
            table.style.borderCollapse = 'collapse';

            const thead = document.createElement('thead');
            const headerRow = document.createElement('tr');
            Object.keys(data[0]).forEach(key => {
                const th = document.createElement('th');
                th.textContent = key;
                th.style.border = '1px solid #ddd';
                th.style.padding = '8px';
                th.style.backgroundColor = '#f2f2f2';
                headerRow.appendChild(th);
            });
            thead.appendChild(headerRow);
            table.appendChild(thead);

            const tbody = document.createElement('tbody');
            data.slice(0, 10).forEach(row => {
                const tr = document.createElement('tr');
                Object.values(row).forEach(value => {
                    const td = document.createElement('td');
                    td.textContent = value;
                    td.style.border = '1px solid #ddd';
                    td.style.padding = '8px';
                    tr.appendChild(td);
                });
                tbody.appendChild(tr);
            });
            table.appendChild(tbody);
            container.appendChild(table);
        }

        renderTable(data);
    }

    function initDataSummary() {
        const container = document.getElementById('summaryContainer');
        if (!container) return;

        const csvData = localStorage.getItem('csvData');
        if (!csvData) {
            container.innerHTML = '<p>No CSV data uploaded yet. Please upload a CSV file on the Home page.</p>';
            return;
        }
        const data = JSON.parse(csvData);
        if (data.length === 0) {
            container.innerHTML = '<p>Uploaded CSV file is empty.</p>';
            return;
        }

        function isNumeric(n) {
            return !isNaN(parseFloat(n)) && isFinite(n);
        }

        const columns = Object.keys(data[0]);
        const stats = {};

        columns.forEach(col => {
            const values = data.map(row => row[col]).filter(isNumeric).map(Number);
            if (values.length > 0) {
                const count = values.length;
                const mean = values.reduce((a, b) => a + b, 0) / count;
                const min = Math.min(...values);
                const max = Math.max(...values);
                stats[col] = { count, mean, min, max };
            }
        });

        if (Object.keys(stats).length === 0) {
            container.innerHTML = '<p>No numeric columns found in the uploaded CSV data.</p>';
            return;
        }

        const table = document.createElement('table');
        table.style.width = '100%';
        table.style.borderCollapse = 'collapse';

        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        ['Column', 'Count', 'Mean', 'Min', 'Max'].forEach(text => {
            const th = document.createElement('th');
            th.textContent = text;
            th.style.border = '1px solid #ddd';
            th.style.padding = '8px';
            th.style.backgroundColor = '#f2f2f2';
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        Object.entries(stats).forEach(([col, stat]) => {
            const tr = document.createElement('tr');
            [col, stat.count, stat.mean.toFixed(2), stat.min, stat.max].forEach(val => {
                const td = document.createElement('td');
                td.textContent = val;
                td.style.border = '1px solid #ddd';
                td.style.padding = '8px';
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        container.innerHTML = '';
        container.appendChild(table);
    }

    function initDataVisualization() {
        const container = document.getElementById('chartsContainer');
        if (!container) return;

        const csvData = localStorage.getItem('csvData');
        if (!csvData) {
            container.innerHTML = '<p>No CSV data uploaded yet. Please upload a CSV file on the Home page.</p>';
            return;
        }
        const data = JSON.parse(csvData);
        if (data.length === 0) {
            container.innerHTML = '<p>Uploaded CSV file is empty.</p>';
            return;
        }

        // Clear container and add canvas elements and buttons
        container.innerHTML = `
            <canvas id="barChart" width="800" height="800"></canvas>
            <button class="download-btn" data-chart="barChart">Download Bar Chart</button>

            <canvas id="lineChart" width="800" height="800"></canvas>
            <button class="download-btn" data-chart="lineChart">Download Line Chart</button>

            <canvas id="pieChart" width="800" height="800"></canvas>
            <button class="download-btn" data-chart="pieChart">Download Pie Chart</button>

            <canvas id="radarChart" width="800" height="800"></canvas>
            <button class="download-btn" data-chart="radarChart">Download Radar Chart</button>

            <canvas id="doughnutChart" width="800" height="800"></canvas>
            <button class="download-btn" data-chart="doughnutChart">Download Doughnut Chart</button>

            <canvas id="scatterChart" width="800" height="800"></canvas>
            <button class="download-btn" data-chart="scatterChart">Download Scatter Chart</button>

            <canvas id="polarAreaChart" width="800" height="800"></canvas>
            <button class="download-btn" data-chart="polarAreaChart">Download Polar Area Chart</button>
        `;

        // Helper function to check if a value is numeric
        function isNumeric(n) {
            return !isNaN(parseFloat(n)) && isFinite(n);
        }

        // Extract numeric columns and their values
        const columns = Object.keys(data[0]);
        const numericColumns = columns.filter(col => data.some(row => isNumeric(row[col])));
        if (numericColumns.length === 0) {
            container.innerHTML = '<p>No numeric columns found in the uploaded CSV data.</p>';
            return;
        }

        // Prepare data for charts - use first numeric column for simplicity
        const labels = data.map((_, index) => `Row ${index + 1}`);
        const firstNumericCol = numericColumns[0];
        const values = data.map(row => Number(row[firstNumericCol]) || 0);

        // Common chart options with datalabels plugin enabled
        const commonOptions = {
            responsive: true,
            plugins: {
                legend: { display: true },
                tooltip: { enabled: true },
                datalabels: {
                    color: '#444',
                    anchor: 'end',
                    align: 'top',
                    font: { weight: 'bold' },
                    formatter: function(value) {
                        return value;
                    }
                }
            },
            scales: {
                y: { beginAtZero: true, title: { display: true, text: firstNumericCol } },
                x: { title: { display: true, text: 'Rows' } }
            }
        };

        // Bar Chart
        const barCtx = document.getElementById('barChart').getContext('2d');
        const barChart = new Chart(barCtx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: firstNumericCol,
                    data: values,
                    backgroundColor: 'rgba(54, 162, 235, 0.7)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
            options: commonOptions,
            plugins: [ChartDataLabels]
        });

        // Line Chart
        const lineCtx = document.getElementById('lineChart').getContext('2d');
        const lineChart = new Chart(lineCtx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: firstNumericCol,
                    data: values,
                    fill: false,
                    borderColor: 'rgba(255, 99, 132, 1)',
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: true },
                    tooltip: { enabled: true },
                    datalabels: {
                        color: '#444',
                        anchor: 'end',
                        align: 'top',
                        font: { weight: 'bold' },
                        formatter: function(value) {
                            return value;
                        }
                    }
                },
                scales: {
                    y: { beginAtZero: true, title: { display: true, text: firstNumericCol } },
                    x: { title: { display: true, text: 'Rows' } }
                }
            },
            plugins: [ChartDataLabels]
        });

        // Pie Chart - use first 5 unique values of first numeric column as categories
        const pieLabels = [...new Set(values.slice(0, 5).map(String))];
        const pieData = pieLabels.map(label => values.filter(v => String(v) === label).length);
        const pieCtx = document.getElementById('pieChart').getContext('2d');
        const pieChart = new Chart(pieCtx, {
            type: 'pie',
            data: {
                labels: pieLabels,
                datasets: [{
                    data: pieData,
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.7)',
                        'rgba(54, 162, 235, 0.7)',
                        'rgba(255, 206, 86, 0.7)',
                        'rgba(75, 192, 192, 0.7)',
                        'rgba(153, 102, 255, 0.7)'
                    ],
                    borderColor: 'rgba(255, 255, 255, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: true },
                    tooltip: { enabled: true },
                    datalabels: {
                        color: '#444',
                        font: { weight: 'bold' },
                        formatter: function(value, context) {
                            return context.chart.data.labels[context.dataIndex] + ': ' + value;
                        }
                    }
                }
            },
            plugins: [ChartDataLabels]
        });

        // Radar Chart - use first 5 rows and numeric columns
        const radarLabels = numericColumns;
        const radarData = data.slice(0, 5).map(row => radarLabels.map(col => Number(row[col]) || 0));
        const radarCtx = document.getElementById('radarChart').getContext('2d');
        const radarChart = new Chart(radarCtx, {
            type: 'radar',
            data: {
                labels: radarLabels,
                datasets: radarData.map((values, i) => ({
                    label: `Row ${i + 1}`,
                    data: values,
                    fill: true,
                    backgroundColor: `rgba(${50 + i*40}, ${99 + i*30}, ${132 + i*20}, 0.2)`,
                    borderColor: `rgba(${50 + i*40}, ${99 + i*30}, ${132 + i*20}, 1)`,
                    pointBackgroundColor: `rgba(${50 + i*40}, ${99 + i*30}, ${132 + i*20}, 1)`
                }))
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: true },
                    tooltip: { enabled: true },
                    datalabels: {
                        display: false
                    }
                },
                scales: {
                    r: {
                        angleLines: { display: true },
                        suggestedMin: 0,
                        suggestedMax: Math.max(...radarData.flat()) + 5,
                        pointLabels: { font: { size: 12 } }
                    }
                }
            },
            plugins: [ChartDataLabels]
        });

        // Doughnut Chart - same data as pie chart
        const doughnutCtx = document.getElementById('doughnutChart').getContext('2d');
        const doughnutChart = new Chart(doughnutCtx, {
            type: 'doughnut',
            data: {
                labels: pieLabels,
                datasets: [{
                    data: pieData,
                    backgroundColor: [
                        'rgba(255, 159, 64, 0.7)',
                        'rgba(255, 205, 86, 0.7)',
                        'rgba(201, 203, 207, 0.7)',
                        'rgba(54, 162, 235, 0.7)',
                        'rgba(153, 102, 255, 0.7)'
                    ],
                    borderColor: 'rgba(255, 255, 255, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: true },
                    tooltip: { enabled: true },
                    datalabels: {
                        color: '#444',
                        font: { weight: 'bold' },
                        formatter: function(value, context) {
                            return context.chart.data.labels[context.dataIndex] + ': ' + value;
                        }
                    }
                }
            },
            plugins: [ChartDataLabels]
        });

        // Download image functionality
        function downloadChartImage(chartId, filename) {
            const canvas = document.getElementById(chartId);
            const link = document.createElement('a');
            link.href = canvas.toDataURL('image/png');
            link.download = filename;
            link.click();
        }

        // Attach event listeners to download buttons
        document.querySelectorAll('.download-btn').forEach(button => {
            button.addEventListener('click', () => {
                const chartId = button.getAttribute('data-chart');
                downloadChartImage(chartId, chartId + '.png');
            });
        });

        // Scatter Chart
        const scatterCtx = document.getElementById('scatterChart').getContext('2d');
        // For scatter, use first two numeric columns if available, else duplicate first column
        const secondNumericCol = numericColumns[1] || firstNumericCol;
        const scatterData = data.map(row => ({
            x: Number(row[firstNumericCol]) || 0,
            y: Number(row[secondNumericCol]) || 0
        }));
        const scatterChart = new Chart(scatterCtx, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: `${firstNumericCol} vs ${secondNumericCol}`,
                    data: scatterData,
                    backgroundColor: 'rgba(255, 159, 64, 0.7)'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: true },
                    tooltip: { enabled: true },
                    datalabels: { display: false }
                },
                scales: {
                    x: { type: 'linear', position: 'bottom', title: { display: true, text: firstNumericCol } },
                    y: { title: { display: true, text: secondNumericCol } }
                }
            }
        });

        // Polar Area Chart
        const polarAreaCtx = document.getElementById('polarAreaChart').getContext('2d');
        const polarAreaChart = new Chart(polarAreaCtx, {
            type: 'polarArea',
            data: {
                labels: pieLabels,
                datasets: [{
                    data: pieData,
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.7)',
                        'rgba(54, 162, 235, 0.7)',
                        'rgba(255, 206, 86, 0.7)',
                        'rgba(75, 192, 192, 0.7)',
                        'rgba(153, 102, 255, 0.7)'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: true },
                    tooltip: { enabled: true },
                    datalabels: {
                        color: '#444',
                        font: { weight: 'bold' },
                        formatter: function(value, context) {
                            return context.chart.data.labels[context.dataIndex] + ': ' + value;
                        }
                    }
                }
            },
            plugins: [ChartDataLabels]
        });
    }

    function initSummaryReportGeneration() {
        const container = document.getElementById('reportContainer');
        if (!container) return;

        const csvData = localStorage.getItem('csvData');
        if (!csvData) {
            container.textContent = 'No CSV data uploaded yet. Please upload a CSV file on the Home page.';
            return;
        }
        const data = JSON.parse(csvData);
        if (data.length === 0) {
            container.textContent = 'Uploaded CSV file is empty.';
            return;
        }

        function isNumeric(n) {
            return !isNaN(parseFloat(n)) && isFinite(n);
        }

        const columns = Object.keys(data[0]);
        const numericColumns = columns.filter(col => data.some(row => isNumeric(row[col])));
        if (numericColumns.length === 0) {
            container.textContent = 'No numeric columns found in the uploaded CSV data.';
            return;
        }

        const stats = {};
        numericColumns.forEach(col => {
            const values = data.map(row => row[col]).filter(isNumeric).map(Number);
            const count = values.length;
            const mean = values.reduce((a, b) => a + b, 0) / count;
            const min = Math.min(...values);
            const max = Math.max(...values);
            stats[col] = { count, mean, min, max };
        });

        let summary = 'Summary Report for Uploaded Data:\n\n';
        summary += `The dataset contains ${data.length} rows and ${columns.length} columns.\n\n`;
        summary += 'Numeric Columns Summary:\n';
        for (const [col, stat] of Object.entries(stats)) {
            summary += `- ${col}: Count = ${stat.count}, Mean = ${stat.mean.toFixed(2)}, Min = ${stat.min}, Max = ${stat.max}\n`;
        }
        summary += '\nVisualizations include bar, line, pie, radar, and doughnut charts representing the distribution and trends of the first numeric column.\n';

        container.textContent = summary;
    }

    function initReportDownload() {
        const downloadBtn = document.getElementById('downloadBtn');
        const message = document.getElementById('message');
        if (!downloadBtn || !message) return;

        downloadBtn.addEventListener('click', () => {
            const csvData = localStorage.getItem('csvData');
            if (!csvData) {
                message.textContent = 'No CSV data uploaded yet. Please upload a CSV file on the Home page.';
                return;
            }
            const data = JSON.parse(csvData);
            if (data.length === 0) {
                message.textContent = 'Uploaded CSV file is empty.';
                return;
            }

            function isNumeric(n) {
                return !isNaN(parseFloat(n)) && isFinite(n);
            }

            const columns = Object.keys(data[0]);
            const numericColumns = columns.filter(col => data.some(row => isNumeric(row[col])));
            if (numericColumns.length === 0) {
                message.textContent = 'No numeric columns found in the uploaded CSV data.';
                return;
            }

            const stats = {};
            numericColumns.forEach(col => {
                const values = data.map(row => row[col]).filter(isNumeric).map(Number);
                const count = values.length;
                const mean = values.reduce((a, b) => a + b, 0) / count;
                const min = Math.min(...values);
                const max = Math.max(...values);
                stats[col] = { count, mean, min, max };
            });

            let report = 'Summary Report for Uploaded Data:\n\n';
            report += `The dataset contains ${data.length} rows and ${columns.length} columns.\n\n`;
            report += 'Numeric Columns Summary:\n';
            for (const [col, stat] of Object.entries(stats)) {
                report += `- ${col}: Count = ${stat.count}, Mean = ${stat.mean.toFixed(2)}, Min = ${stat.min}, Max = ${stat.max}\n`;
            }
            report += '\nVisualizations include bar, line, pie, radar, and doughnut charts representing the distribution and trends of the first numeric column.\n';

            const blob = new Blob([report], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'summary_report.txt';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            message.textContent = 'Report downloaded successfully.';
        });
    }
});

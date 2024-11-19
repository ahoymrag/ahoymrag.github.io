document.addEventListener('DOMContentLoaded', function() {
    fetch('pecan/networth.json')
        .then(response => response.json())
        .then(data => {
            const netWorthSection = document.getElementById('netWorthSection');
            let htmlContent = '<h2>Net Worth Over Time</h2><table style="width: 100%; border-collapse: collapse;">';
            htmlContent += '<tr><th>Date</th><th>Value</th></tr>';

            data.net_worth.forEach(entry => {
                htmlContent += `<tr>
                    <td style="padding: 8px; border-bottom: 1px solid #ccc;">${entry.date}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #ccc;">$${entry.value.toLocaleString()}</td>
                </tr>`;
            });

            htmlContent += '</table>';
            netWorthSection.innerHTML = htmlContent;
        })
        .catch(error => console.error('Error fetching net worth data:', error));
});
document.addEventListener('DOMContentLoaded', function() {
    fetch('land-search.json')
        .then(response => response.json())
        .then(data => {
            const tableBody = document.querySelector('#landTable tbody');
            data.forEach(item => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${item.zip_code || 'N/A'}</td>
                    <td>${item.address}</td>
                    <td>${item.size_acres}</td>
                    <td>${item.cost}</td>
                    <td>${item.distance_to_06512_mi}</td>
                    <td>${item.driving_time_from_06512_hours}</td>
                    <td>${item.water_access}</td>
                    <td><a href="${item.url}" target="_blank">Link</a></td>
                    <td>${item.source}</td>
                    <td>${item.status}</td>
                `;
                tableBody.appendChild(row);
            });

            // Initialize DataTable
            $('#landTable').DataTable({
                "order": [] // Default no initial sorting
            });
        })
        .catch(error => console.error('Error loading JSON:', error));
});
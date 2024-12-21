// Fetch the local markdown file
fetch('./private/weeks/week51-23.md')
    .then(response => response.text())
    .then(data => {
        // Convert markdown to HTML
        const html = marked(data);

        // Insert the HTML into the widget
        document.getElementById('weekly-tasks').innerHTML = html;
    })
    .catch(error => console.error('Error:', error));
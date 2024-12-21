fetch('https://ahoymrag.github.io/projects/ahoy/AHOY-deets.md')
    .then(response => response.text())
    .then(data => {
        const markdown = marked(data);
        document.getElementById('ahoy-tasks').innerHTML = markdown;
    })
    .catch((error) => {
        console.error('Error:', error);
    });
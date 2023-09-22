document.getElementById('logForm').addEventListener('submit', function(e) {
    e.preventDefault();

    var title = document.getElementById('logTitle').value;
    var content = document.getElementById('logContent').value;

    var logEntry = document.createElement('div');
    logEntry.classList.add('logEntry');

    var logTitle = document.createElement('h2');
    logTitle.textContent = title;
    logEntry.appendChild(logTitle);

    var logContent = document.createElement('p');
    logContent.textContent = content;
    logEntry.appendChild(logContent);

    document.getElementById('logEntries').appendChild(logEntry);

    document.getElementById('logTitle').value = '';
    document.getElementById('logContent').value = '';
});

window.onload = function() {
    var request = new XMLHttpRequest();
    request.open('GET', 'https://api.github.com/repos/ahoymrag/ahoymrag.github.io/events', true);
    request.onload = function() {
        if (this.status >= 200 && this.status < 400) {
            var data = JSON.parse(this.response);
            var updatesDiv = document.getElementById('updates');
            data.forEach(function(event) {
                if (event.type === 'PushEvent') {
                    var commit = event.payload.commits[0]; // Get the first commit
                    var update = document.createElement('div');
                    update.className = 'update';
                    update.innerHTML = '<h3>' + commit.message.split('\n')[0] + '</h3>' + // Commit title
                        '<p>' + new Date(event.created_at).toLocaleString() + '</p>' +
                        '<p>' + event.actor.login + '</p>' +
                        '<p>' + commit.message.split('\n').slice(1).join('\n') + '</p>'; // Commit description
                    updatesDiv.appendChild(update);
                }
            });
        } else {
            console.error('GitHub API request failed');
        }
    };
    request.onerror = function() {
        console.error('GitHub API request failed');
    };
    request.send();
};
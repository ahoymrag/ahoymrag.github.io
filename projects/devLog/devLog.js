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
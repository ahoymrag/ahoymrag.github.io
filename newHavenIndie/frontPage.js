fetch('frontPage.json')
  .then(response => response.json())
  .then(data => {
    const articles = data.paper.articles;
    const articlesContainer = document.getElementById('articles');

    articles.forEach(article => {
      const articleElement = document.createElement('div');
      articleElement.className = 'grid-item';

      const title = document.createElement('h3');
      title.textContent = article.title;
      articleElement.appendChild(title);

      const author = document.createElement('p');
      author.textContent = `Author: ${article.author}`;
      articleElement.appendChild(author);

      const category = document.createElement('p');
      category.textContent = `Category: ${article.category}`;
      articleElement.appendChild(category);

      const content = document.createElement('p');
      content.textContent = article.content;
      articleElement.appendChild(content);

      articlesContainer.appendChild(articleElement);
    });
  });

  fetch('frontPage.json')
  .then(response => response.json())
  .then(data => {
    const musicCategory = data.paper.categories.find(category => category.name === 'Music');
    const bands = musicCategory.bands;

    const bandsList = document.createElement('ul');
    bands.forEach(band => {
      const listItem = document.createElement('li');
      listItem.textContent = band;
      bandsList.appendChild(listItem);
    });

    document.getElementById('eventDetails').appendChild(bandsList);
  })
  .catch(error => console.error('Error:', error));


  function showEvent(eventId) {
    var eventDescriptions = {
      1: 'The Indie Music Festival features local bands and artists from the New Haven area.',
      2: 'The Local Art Show showcases the work of talented painters, sculptors, and other visual artists.',
      3: 'The Film Screening will present a selection of independent films from around the world.',
      4: 'The Poetry Reading will feature readings from local poets, as well as an open mic session.',
      // ...other event descriptions
    };
    document.getElementById('eventDetails').innerHTML = eventDescriptions[eventId];
    document.getElementById('eventDetails').style.display = 'block';
  }
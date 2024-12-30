// Function to fetch the JSON content
async function fetchJSONContent() {
    const response = await fetch('data/blog_1.json');
    return await response.json();
}

// Function to update the HTML content
function updateHTMLContent(data) {
    // Update menu
    const menuContainer = document.getElementById('sidebar');
    menuContainer.innerHTML = data.menu.map(item => `<div class="menu-item" data-target="${item.toLowerCase().replace(' ', '-')}">${item}</div>`).join('');

    // Update featured articles
    const featuredArticlesContainer = document.getElementById('featured-articles');
    featuredArticlesContainer.innerHTML = data.featuredArticles.map(article => `
      <div class="blog-header">
        <div class="blog-article header-article">
          <div class="blog-big__title">${article.title || ''}</div>
          <div class="blog-menu small-title date">${article.date || ''}</div>
        </div>
        <div class="blog-article">
          ${article.image ? `<img src="${article.image}" alt="">` : ''}
          <h2>${article.description || ''}</h2>
          <div class="blog-detail">
            <span>${article.author || ''}</span>
            <span>${article.readTime || ''}</span>
          </div>
          <p>${article.content || ''}</p>
          ${article.seeMore ? `<a href="#">${article.seeMore}</a>` : ''}
        </div>
      </div>
    `).join('');

    // Update featured thoughts
    const featuredThoughtsContainer = document.getElementById('featured-thoughts');
    featuredThoughtsContainer.innerHTML = `
      <div class="blog-right-title-container">
        <div class="blog-right-title">Featured Thoughts</div>
        <div class="blog-menu rounded">See All</div>
      </div>
      <div class="blog-right">
        ${data.rightBlog.featuredArticles.map(article => `
          <div class="blog-right-container">
            <div class="blog-title-date">
              <div class="date">${article.date}</div>
            </div>
            <div class="blog-right-page-title">${article.title}</div>
            <div class="blog-right-page-subtitle">${article.content}</div>
          </div>
        `).join('')}
      </div>
    `;

    // Update movie reviews
    const movieReviewsContainer = document.getElementById('movie-reviews');
    movieReviewsContainer.innerHTML = `
      <div class="blog-right-title-container">
        <div class="blog-right-title">Movie Reviews</div>
        <div class="blog-menu rounded">See All</div>
      </div>
      <div class="movie-reviews">
        ${data.movieReviews.map(movie => `
          <div class="movie-review">
            <h3><a href="${movie.link}" target="_blank">${movie.title}</a></h3>
            <p>${movie.review}</p>
          </div>
        `).join('')}
      </div>
    `;

    // Update links
    const linksContainer = document.getElementById('links') || document.createElement('div');
    linksContainer.id = 'links';
    linksContainer.innerHTML = `
      <div class="blog-right-title-container">
        <div class="blog-right-title">Useful Links</div>
      </div>
      <ul>
        ${data.links.map(link => `
          <li><a href="${link.url}" target="_blank">${link.title}</a> - ${link.description}</li>
        `).join('')}
      </ul>
    `;
    document.getElementById('main-content').appendChild(linksContainer);

    // Update subscribe section
    const subscribeContainer = document.getElementById('subscribe') || document.createElement('div');
    subscribeContainer.id = 'subscribe';
    subscribeContainer.innerHTML = `
      <div class="blog-right-title-container">
        <div class="blog-right-title">${data.subscribe.title}</div>
      </div>
      <p>${data.subscribe.description}</p>
      <form>
        <input type="email" placeholder="Enter your email" required>
        <button type="submit">${data.subscribe.buttonText}</button>
      </form>
    `;
    document.getElementById('main-content').appendChild(subscribeContainer);
}

// Main function to run the script
async function main() {
    const jsonData = await fetchJSONContent();
    updateHTMLContent(jsonData);

    // Handle sidebar item clicks
    const sidebar = document.getElementById('sidebar');
    sidebar.addEventListener('click', function(event) {
        if (event.target.classList.contains('menu-item')) {
            const targetId = event.target.dataset.target;
            showContent(targetId);
        }
    });

    // Initially show the home content
    showContent('home');
}

function showContent(targetId) {
    // Hide all content sections
    document.querySelectorAll('#main-content > div').forEach(div => {
        div.style.display = 'none';
    });

    // Show the selected content
    if (targetId === 'home') {
        document.querySelector('.blog-header').style.display = 'block';
        document.getElementById('featured-articles').style.display = 'block';
    } else if (targetId === 'featured-thoughts') {
        document.getElementById('featured-thoughts').style.display = 'block';
    } else if (targetId === 'movie-reviews') {
        document.getElementById('movie-reviews').style.display = 'block';
    } else if (targetId === 'links') {
        document.getElementById('links').style.display = 'block';
    } else if (targetId === 'subscribe') {
        document.getElementById('subscribe').style.display = 'block';
    }
}

// Run the main function when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', main);
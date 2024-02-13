<template>
    <div class="user-dashboard">
      <h1>User Dashboard</h1>
      <p>Welcome to your User Dashboard. Here you can view your app's analytics and manage content.</p>
      <div class="app-container">
        <div class="app-header">
          <div class="app-header-left">
            <span class="app-icon"></span>
            <p class="app-name">CinemaFi Portfolio</p>
            <div class="search-wrapper">
              <input class="search-input" type="text" placeholder="Search">
            </div>
          </div>
          <div class="app-header-right">
            <button class="mode-switch" title="Switch Theme"></button>
            <button class="add-btn" title="Add New Movie"></button>
            <button class="notification-btn"></button>
            <button class="profile-btn">
              <span>Aybüke C.</span>
            </button>
          </div>
          <button class="messages-btn"></button>
        </div>
        <div class="app-content">
          <div class="app-sidebar">
            <a href="" class="app-sidebar-link active"></a>
            <a href="" class="app-sidebar-link">Movie 1</a>
            <a href="" class="app-sidebar-link">Movie 2</a>
            <a href="" class="app-sidebar-link">Movie 3</a>
          </div>
          <div class="movies-section">
            <div class="movies-section-header">
              <p>Movies</p>
              <p class="time">Feb 12, 2024</p>
            </div>
            <div class="movies-section-line">
              <div class="movies-status">
                <div class="item-status">
                  <span class="status-number">45</span>
                  <span class="status-type">Now Showing</span>
                </div>
                <div class="item-status">
                  <span class="status-number">24</span>
                  <span class="status-type">Coming Soon</span>
                </div>
                <div class="item-status">
                  <span class="status-number">62</span>
                  <span class="status-type">Total Movies</span>
                </div>
              </div>
              <div class="view-actions">
                <button class="view-btn list-view" title="List View"></button>
                <button class="view-btn grid-view active" title="Grid View"></button>
              </div>
            </div>
            <div class="movie-boxes jsGridView">
              <!-- Repeat this block for each movie -->
              <div class="movie-box-wrapper">
                <div class="movie-box" style="background-color: #fee4cb;">
                  <div class="movie-box-header">
                    <span>December 10, 2020</span>
                  </div>
                  <div class="movie-box-content-header">
                    <p class="box-content-header">Movie Title</p>
                    <p class="box-content-subheader">Genre</p>
                  </div>
                  <div class="box-progress-wrapper">
                    <p class="box-progress-header">Popularity</p>
                    <div class="box-progress-bar">
                      <span class="box-progress" style="width: 60%; background-color: #ff942e"></span>
                    </div>
                    <p class="box-progress-percentage">60%</p>
                  </div>
                  <div class="movie-box-footer">
                    <div class="days-left" style="color: #ff942e;">
                      2 Days Left
                    </div>
                  </div>
                </div>
              </div>
              <div class="movie-box-wrapper">
                <div class="movie-box" style="background-color: #fee4cb;">
                  <div class="movie-box-header">
                    <span>December 10, 2020</span>
                  </div>
                  <div class="movie-box-content-header">
                    <p class="box-content-header">Movie Title</p>
                    <p class="box-content-subheader">Genre</p>
                  </div>
                  <div class="box-progress-wrapper">
                    <p class="box-progress-header">Popularity</p>
                    <div class="box-progress-bar">
                      <span class="box-progress" style="width: 60%; background-color: #ff942e"></span>
                    </div>
                    <p class="box-progress-percentage">60%</p>
                  </div>
                  <div class="movie-box-footer">
                    <div class="days-left" style="color: #ff942e;">
                      2 Days Left
                    </div>
                  </div>
                </div>
              </div>
              <div class="movie-box-wrapper">
                <div class="movie-box" style="background-color: #fee4cb;">
                  <div class="movie-box-header">
                    <span>December 10, 2020</span>
                  </div>
                  <div class="movie-box-content-header">
                    <p class="box-content-header">Movie Title</p>
                    <p class="box-content-subheader">Genre</p>
                  </div>
                  <div class="box-progress-wrapper">
                    <p class="box-progress-header">Popularity</p>
                    <div class="box-progress-bar">
                      <span class="box-progress" style="width: 60%; background-color: #ff942e"></span>
                    </div>
                    <p class="box-progress-percentage">60%</p>
                  </div>
                  <div class="movie-box-footer">
                    <div class="days-left" style="color: #ff942e;">
                      2 Days Left
                    </div>
                  </div>
                </div>
              </div>
              <div class="movie-box-wrapper">
                <div class="movie-box" style="background-color: #fee4cb;">
                  <div class="movie-box-header">
                    <span>December 10, 2020</span>
                  </div>
                  <div class="movie-box-content-header">
                    <p class="box-content-header">Movie Title</p>
                    <p class="box-content-subheader">Genre</p>
                  </div>
                  <div class="box-progress-wrapper">
                    <p class="box-progress-header">Popularity</p>
                    <div class="box-progress-bar">
                      <span class="box-progress" style="width: 60%; background-color: #ff942e"></span>
                    </div>
                    <p class="box-progress-percentage">60%</p>
                  </div>
                  <div class="movie-box-footer">
                    <div class="days-left" style="color: #ff942e;">
                      2 Days Left
                    </div>
                  </div>
                </div>
              </div>
              <div class="movie-box-wrapper">
                <div class="movie-box" style="background-color: #fee4cb;">
                  <div class="movie-box-header">
                    <span>December 10, 2020</span>
                  </div>
                  <div class="movie-box-content-header">
                    <p class="box-content-header">Movie Title</p>
                    <p class="box-content-subheader">Genre</p>
                  </div>
                  <div class="box-progress-wrapper">
                    <p class="box-progress-header">Popularity</p>
                    <div class="box-progress-bar">
                      <span class="box-progress" style="width: 60%; background-color: #ff942e"></span>
                    </div>
                    <p class="box-progress-percentage">60%</p>
                  </div>
                  <div class="movie-box-footer">
                    <div class="days-left" style="color: #ff942e;">
                      2 Days Left
                    </div>
                  </div>
                </div>
              </div>
              <div class="movie-box-wrapper">
                <div class="movie-box" style="background-color: #fee4cb;">
                  <div class="movie-box-header">
                    <span>December 10, 2020</span>
                  </div>
                  <div class="movie-box-content-header">
                    <p class="box-content-header">Movie Title</p>
                    <p class="box-content-subheader">Genre</p>
                  </div>
                  <div class="box-progress-wrapper">
                    <p class="box-progress-header">Popularity</p>
                    <div class="box-progress-bar">
                      <span class="box-progress" style="width: 60%; background-color: #ff942e"></span>
                    </div>
                    <p class="box-progress-percentage">60%</p>
                  </div>
                  <div class="movie-box-footer">
                    <div class="days-left" style="color: #ff942e;">
                      2 Days Left
                    </div>
                  </div>
                </div>
              </div>
              <div class="movie-box-wrapper">
                <div class="movie-box" style="background-color: #fee4cb;">
                  <div class="movie-box-header">
                    <span>December 10, 2020</span>
                  </div>
                  <div class="movie-box-content-header">
                    <p class="box-content-header">Movie Title</p>
                    <p class="box-content-subheader">Genre</p>
                  </div>
                  <div class="box-progress-wrapper">
                    <p class="box-progress-header">Popularity</p>
                    <div class="box-progress-bar">
                      <span class="box-progress" style="width: 60%; background-color: #ff942e"></span>
                    </div>
                    <p class="box-progress-percentage">60%</p>
                  </div>
                  <div class="movie-box-footer">
                    <div class="days-left" style="color: #ff942e;">
                      2 Days Left
                    </div>
                  </div>
                </div>
              </div>
              <div class="movie-box-wrapper">
                <div class="movie-box" style="background-color: #fee4cb;">
                  <div class="movie-box-header">
                    <span>December 10, 2020</span>
                  </div>
                  <div class="movie-box-content-header">
                    <p class="box-content-header">Movie Title</p>
                    <p class="box-content-subheader">Genre</p>
                  </div>
                  <div class="box-progress-wrapper">
                    <p class="box-progress-header">Popularity</p>
                    <div class="box-progress-bar">
                      <span class="box-progress" style="width: 60%; background-color: #ff942e"></span>
                    </div>
                    <p class="box-progress-percentage">60%</p>
                  </div>
                  <div class="movie-box-footer">
                    <div class="days-left" style="color: #ff942e;">
                      2 Days Left
                    </div>
                  </div>
                </div>
              </div>
              <div class="movie-box-wrapper">
                <div class="movie-box" style="background-color: #fee4cb;">
                  <div class="movie-box-header">
                    <span>December 10, 2020</span>
                  </div>
                  <div class="movie-box-content-header">
                    <p class="box-content-header">Movie Title</p>
                    <p class="box-content-subheader">Genre</p>
                  </div>
                  <div class="box-progress-wrapper">
                    <p class="box-progress-header">Popularity</p>
                    <div class="box-progress-bar">
                      <span class="box-progress" style="width: 60%; background-color: #ff942e"></span>
                    </div>
                    <p class="box-progress-percentage">60%</p>
                  </div>
                  <div class="movie-box-footer">
                    <div class="days-left" style="color: #ffdebe;">
                      2 Days Left
                    </div>
                  </div>
                </div>
              </div>
              <!-- End of movie box wrapper -->
            </div>
          </div>
        </div>
      </div>
      <div class="messages-section">
        <button class="messages-close"></button>
        <div class="projects-section-header">
          <p>Client Messages</p>
        </div>
        <div class="messages">
          <!-- Repeat this block for each message -->
          <div class="message-box">
            <div class="message-content">
                <div class="message-header">
                    <div class="name">Stephanie</div>
                  </div>
                  <p class="message-line">
                    I got your first assignment. It was quite good. 🥳 We can continue with the next assignment.
                  </p>
                  <p class="message-line time">
                    Dec, 12
                  </p>
                </div>
              </div>
              <!-- Additional message boxes go here -->
            </div>
          </div>
        </div>
      </template>


<script>
export default {
  name: 'UserDashboard', // Updated component name to be multi-word
}
</script>

<style scoped>
@import '../assets/user-dashboard.css';
</style>
# AG Website Deck - Design Specs

# Layout and Styling

## Responsive Three-Column Layout:
- **Left**: Work-related widgets (Project tasks for Mission Anabaino and CPC).
- **Middle**: Stats (Visitor count, GitHub commits, Financial stats).
- **Right**: Action items (Contact list, Research list).
- **Navigation Bar**: At the top, for easy access to different sections or external links.
- **Bottom Toolbar**: For additional controls or information.

## Styling:
- Glassmorphism for a modern, sleek look.
- Blurry rotating background images from Unsplash featuring the night sky.

# Widgets and Data

## Visitor Count for Ahoy:
- Display current visitor statistics.
- Possibly integrate with analytics service for real-time data.

## Latest GitHub Commits:
- Widgets for ag.ooo and ahoy.ooo repositories.
- Use GitHub API to fetch the latest commits.

## Latest Project Tasks for Mission Anabaino:
- List of recent tasks or updates.
- Could be linked to a project management tool.

## Latest Project Tasks for CPC:
- Similar to Mission Anabaino but for CPC tasks.

## Current Weekly Financials:
- Display financial stats like expenditures, revenue, etc.
- Integration with a financial management tool can provide real data.

## List of Projects and Their Status:
- Overview of all ongoing projects.
- Status indicators (e.g., In Progress, Completed).

## Contact List:
- Important contacts related to projects.
- Option to add, remove, or edit contacts.

## Research List:
- Ongoing research topics or items.
- Links to resources or findings.

# Implementation Steps

## Structure the HTML:
- Define the three-column layout with div elements.
- Create placeholders for each widget.

## Design the CSS:
- Apply glassmorphism effects.
- Ensure responsiveness for different screen sizes.
- Style the navbar and bottom toolbar.

## JavaScript for Dynamic Content:
- Fetch data from APIs (e.g., GitHub).
- Populate widgets with real or dummy data for now.
- Implement the rotating background using Unsplash API.

## Testing and Iteration:
- Test on different devices and browsers.
- Gather feedback and make necessary adjustments.

# Development Considerations
- **Modularity**: Ensure each widget is self-contained for easy maintenance and updates.
- **Performance**: Optimize for loading times, especially with external API calls.
- **Security**: Secure API keys and sensitive data.
- **Accessibility**: Ensure the website is accessible to users with disabilities.
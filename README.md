# B3 Production


This project focuses on developing a Node.js web application that can integrate with GitLab API to fetch repo issues in real-time by using Webhooks. The application can fetch issues, create issues, edit issues, update issue statues, add comments, and provides OAUTH authentication mechanisms. It establishes a websocket connection to receive confirmation of changes on the repository, allowing the app to dynamically create or update UI components on the frontend. Using a production server, the app is deployed through Nginx reverse proxy.

## Production Server Instructions

1. Access production server
2. Define the configuration
3. Transfer the source code to the production server
4. Using pm2, start the node app

## Code Structure

The entry point to run the server is app.js which initializes establishes a websocket, applies app-level middleware, mounts the core routes, and listens to a specific port. The structure of src directory mainly revolves around routes and controller files related to issues (e.g. rendering, creating, updating, comments, statuses) but also includes some utility files related to authentication and http. On the public directory, the app serves static content like images and css, but also the frontend client javascript to dynamically update the UI following received webhooks.

guestbook-server
================

The front desk in the lobby of Blue Jeans Network in Mountain View has a visitor sign-in system. Guests use an iPad to enter their name and company, as well as who they are visiting. Emails and chat notifications are sent to this person to let them know they have a visitor, and a record of the visit is saved for security compliance.

This server is responsible for communicating with the database, calendar server provider, mail transfer agent, and chat service. It exposes an HTTP API for the iOS client to use, as well as a web-based interface for receptionists that shows upcoming meetings and allows historical report generation.

## REST API Documentation

See `doc/index.html` for REST API documentation.

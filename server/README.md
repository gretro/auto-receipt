# Auto Receipt - Server

## Requirements

- NodeJS 12.x
- Docker and docker-compose

## Run locally

1. Set up your environment file (`.env`) with the following API keys

- Twilio SendGrid API Key (`SENDGRID_API_KEY`)

2. Make sure the dependent services are up and running (see below)
3. Open a Terminal and navigate to the `server` directory
4. Run `npm install`
5. Run `npm start`

### Dependent services

The application depends on some services. To facilitate development, those have been dockerize. To launch them:

1. Open a Terminal and navigate to the `server` directory
2. Run `docker-compose up`

Everything should start running. Creating the Docker image for the first time may take a few minutes however.

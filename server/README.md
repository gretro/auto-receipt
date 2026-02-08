# Auto Receipt - Server

## Requirements

- NodeJS 24.x
- Docker and docker-compose

## Run locally

1. Make sure the dependent services are up and running (see below)
2. Open a Terminal and navigate to the `server` directory
3. Run `npm run prepare` to install a working browser
4. Run `npm install`
5. Run `npm start`

### Dependent services

The application depends on some services. To facilitate development, those have been dockerize. To launch them:

1. Open a Terminal and navigate to the `server` directory
2. Run `docker-compose up`

Everything should start running. Creating the Docker image for the first time may take a few minutes however.

#### View emails

Open a browser to http://localhost:6080

## Making an HTTP request

We use Bruno to setup the supported endpoints. Locally, no authentication is required. You can import the `AutoReceipt` collection.

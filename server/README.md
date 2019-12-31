# Auto Receipt - Server

## Requirements

- NodeJS 10.x
- Docker and docker-compose

## Run locally

1. Make sure the dependent services are up and running (see below)
2. Open a Terminal and navigate to the `server` directory
3. Run `npm install`
4. Run `npm start`

### Dependent services

The application depends on some services. To facilitate development, those have been dockerize. To launch them:

1. Open a Terminal and navigate to the `server` directory
2. Run `docker-compose up`

Everything should start running. Creating the Docker image for the first time may take a few minutes however.

## Deployment

The project is currently deployed on Google Cloud Platform, but should work with pretty much any Cloud provider since it uses [serverless](https://serverless.com/) as an abstraction layer

### Deployment in Google Cloud Platform (GCP)

You can deploy to different environments. So far, the existing environments are:

- staging
- production

#### Create the project (as necessary)

1. Follow the [instructions laid out by serverless](https://serverless.com/framework/docs/providers/google/guide/credentials/)

#### Create the Firestore database (as necessary)

1. Open the Google Cloud Console in a browser
2. Select the correct project
3. In the left menu, select `Firestore`
4. Select the native mode and choose the location of the database.
5. When the database is ready, click on `index` on the left navigation bar
6. Create a composite index on the following fields on the `donations` collection:

- value.fiscalYear: ASC
- value.created: DESC

_This needs to be automated in the future_

#### Setup the deployment

1. Copy your keyfile to `server/.gcloud/keyfile.<environment>.json` (obtained when you created the Service Account)
2. Create a file named `secrets.<environment>.yml` and include this content (replace `<KEY_HERE>` by an actual random API key)

   ```yaml
   api:
     apiToken: <KEY_HERE>
   ```

   The token you just put in here will be your API Token (in the mean time we implement OAuth). You will need to send it in the `Authorization` header at each request (except the Paypal IPN endpoint)

3. Open a terminal in the `server` directory
4. Run `npm run deploy:<environment>`

If you set up everything correctly, serverless should take care of the deployment for you

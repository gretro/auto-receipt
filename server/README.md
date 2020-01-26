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
3. In the left panel, select `Firestore`
4. Select the native mode and choose the location of the database.
5. When the database is ready, click on `index` on the left navigation bar
6. Create a composite index on the following fields on the `donations` collection:

- value.fiscalYear: ASC
- value.created: DESC

_This needs to be automated in the future_

#### Create the topics (as necessary)

1. Open the Google Cloud Console in a browser
2. Select the correct project
3. In the left panel, select `Pub/Sub`
4. Click on the `Create topic` button
5. Enter the topic id in the field. A list of the required topics will be listed below
6. Leave other options to the default value and click `Create topic`

Required topics:

- pdf-generation
- email-receipt

#### Create the Storage buckets (as necessary)

1. Open the Google Cloud Console in a browser
2. Select the correct project
3. In the left panel, select `Storage`
4. Click on the `Create bucket` button
5. Choose a name for you bucket and enter the relevant options described below (depending on the bucket purpose)
6. Click the `Create` button

##### Handlebars references Bucket

This bucket will store Handlebars templates and translations, among other references needed to generate different HTML documents.

- Store the data in either `Region` or `Multi-Region` depending on your needs.
- Choose `Standard` as the default storage class. We need performance for this usage.
- Leave the Control access option to `Fine Grained`, as you may want to expose public resources here (like CSS, JS, etc).
- Leave other options to default values.
- Update the configuration for `templatesBucket` and `translationsBucket` with the bucket name.

##### Document Bucket

This bucket will store Documents that need archiving after they are sent for legal purposes. In our case, they will store PDF receipts so we can refer to them later on.

- Store the data in either `Region` or `Multi-Region` depending on your needs.
- Choose `Standard` as the default storage class. Upon creating, we'll need to access the file a few times in order to send it.
- Choose `Uniform` in the Control access option. We want everything to be handled at the bucket level as we will upload quite often in here.
- Leave other options to default values
- Click on the `Create` button
- Once the bucket is created, click on the `Bucket Lock` tab and add a lifecycle rule
- Create the lifecycle rule based on:
  - Age : 1 day
  - Action: Set to Archive
- Update the configuration for `documentsBucket` with the bucket name.

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

#### Adjust Pub/Sub functions

Currently, the Google Cloud plugin for Serverless does not support `Retry on failure`. This may not be important in staging, but in Production, it needs to be enabled (this is why we use Pub/Sub events after all...)

1. Open the Google Cloud Console in a browser
2. Select the correct project
3. In the left panel, select `Cloud Functions`
4. Open the function that needs to be modified
5. Click the `Edit` button
6. Expand the `Environment variables, networking, timeouts and more` section
7. Check the `Retry on failure` option and leave everything else
8. Click the `Deploy` button

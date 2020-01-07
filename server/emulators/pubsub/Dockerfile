FROM google/cloud-sdk:274.0.1-alpine

RUN apk add openjdk8-jre && \
  gcloud components install beta pubsub-emulator

EXPOSE 8080

ENTRYPOINT [ "gcloud", "beta", "emulators", "pubsub", "start", "--project=autoreceipt", "--host-port=0.0.0.0:8080" ]
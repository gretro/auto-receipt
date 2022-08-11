FROM google/cloud-sdk:alpine

RUN apk add openjdk17-jre && \
  gcloud components install beta cloud-firestore-emulator && \
  gcloud components install beta pubsub-emulator

EXPOSE 8080

ENTRYPOINT [ "gcloud", "beta", "emulators" ]
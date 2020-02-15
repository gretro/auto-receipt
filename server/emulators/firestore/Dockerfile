FROM google/cloud-sdk:280.0.0-alpine

RUN apk add openjdk8-jre && \
  gcloud components install beta cloud-firestore-emulator

EXPOSE 8080

ENTRYPOINT [ "gcloud", "beta", "emulators", "firestore", "start", "--host-port=0.0.0.0:8080" ]
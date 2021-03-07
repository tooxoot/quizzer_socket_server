IMAGENAME=ghcr.io/tooxoot/quizzer-server

build-target-build:
	docker build --build-arg GITHUB_READ_PACKAGES_TOKEN --target build -t ${IMAGENAME}:build .

build-target-test:
	docker build --build-arg GITHUB_READ_PACKAGES_TOKEN --target test --cache-from ${IMAGENAME}:build -t ${IMAGENAME}:test .

build-target-release:
	docker build --build-arg GITHUB_READ_PACKAGES_TOKEN --target release --cache-from ${IMAGENAME}:build -t ${IMAGENAME}:release -t ${IMAGENAME}:latest .

build-all: build-target-build build-target-test build-target-release

push-latest:
	docker push ${IMAGENAME}:latest

clean-prune:
	docker rm -f $(docker ps -a -f ancestor=${IMAGENAME}:build) || \
	docker rm -f $(docker ps -a -f ancestor=${IMAGENAME}:test) || \
	docker rm -f $(docker ps -a -f ancestor=${IMAGENAME}:release) || \
	docker rm -f $(docker ps -a -f ancestor=${IMAGENAME}:latest) || \
	docker image rm ${IMAGENAME}:build || \
	docker image rm ${IMAGENAME}:test || \
	docker image rm ${IMAGENAME}:release || \
	docker image rm ${IMAGENAME}:latest || \
	docker image prune || \
	true

run-test:
	docker run -e IMAGE=${IMAGENAME}:release -v /var/run/docker.sock:/var/run/docker.sock ${IMAGENAME}:test

run-release:
	docker run -it -p 8080:8080 ${IMAGENAME}:release
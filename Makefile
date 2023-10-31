start:
	@docker compose up -d

stop:
	@docker compose down

build-backend:
	@cd ./back-end && tsc

start-server: build-backend
	@cd ./back-end/build && node index.js



deploy:
	@cd ./terraform && \
	terraform init && \
	terraform apply --auto-approve

install-packages:
	@cd ./back-end && npm i && npx build-opencv -version 4.6.0 rebuild
	@cd ./front-end && npm i


build-all: start deploy  install-packages build-backend
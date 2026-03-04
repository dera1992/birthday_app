build:
	docker compose build

up:
	docker compose up --build

down:
	docker compose down

migrate:
	docker compose exec web python manage.py migrate

createsuperuser:
	docker compose exec web python manage.py createsuperuser

test:
	docker compose exec web python manage.py test

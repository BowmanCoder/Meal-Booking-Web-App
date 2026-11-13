# BookMyMeal

An employee meal booking web app. Employees pre-book canteen meals, the kitchen sees how many to prepare, and each booking carries a coupon that is redeemed when the meal is collected.

> **Status: under active rebuild.** This started as an internship project and is being completed stage by stage. Authentication works; the booking flow is being rebuilt. See the roadmap below.

## Tech stack

- **Backend:** Django, Django REST Framework, SimpleJWT (JWT auth), SQLite for local development
- **Frontend:** React 18, Redux Toolkit / RTK Query, MUI

## Run it locally

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env             # then set DJANGO_SECRET_KEY in .env
python manage.py migrate
python manage.py seed_demo       # demo meals, menus, accounts and booking history
python manage.py runserver       # http://127.0.0.1:8000
```

`seed_demo` prints the demo sign-ins (an admin, a canteen staff member and an employee). To create your own admin instead, run `python manage.py createsuperuser`.

Generate a secret key with:

```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

With no SMTP credentials in `.env`, emails such as password reset links are printed to the server console.

Run the backend tests with `python manage.py test`.

### API overview

All endpoints are under `/api/` and need a JWT access token (`Authorization: Bearer <token>`), except register, login and password reset.

| Endpoint | Who | What |
|---|---|---|
| `POST register/`, `POST login/` | anyone | Create an account, get tokens |
| `POST resetpasswordemail/`, `POST resetpassword/<uid>/<token>/` | anyone | Request and use a password reset link |
| `GET profile/`, `PATCH profile/` | signed in | Your account and role; edit name and dietary preference |
| `POST changepassword/` | signed in | Needs `current_password` |
| `GET meals/` | signed in | Meal slots and their booking cut-offs |
| `GET menus/?date_from=&date_to=` | signed in | What is being served |
| `POST meals/`, `POST menus/` (and edit, delete) | admin | Manage meals and menus |
| `GET bookings/` | signed in | Your bookings (staff and admins see everyone's) |
| `POST bookings/` | signed in | Book `{meal, date}` or `{meal, start_date, end_date}`, optional `guest_name` |
| `DELETE bookings/<id>/` | owner, admin | Cancel before the cut-off |

Booking rules enforced by the server: one own booking per person, date and meal; no bookings or cancellations after the meal's cut-off; redeemed bookings cannot be cancelled.

### Frontend

```bash
cd frontend
npm install
npm start                        # http://localhost:3000
```

The frontend expects the API at `http://127.0.0.1:8000/api/`.

## Roadmap

| Stage | Outcome |
|---|---|
| 0. Hygiene and security | Secrets out of the repo, reproducible setup |
| 1. Backend core | Meal plans, bookings, roles, booking rules, API tests |
| 2. Redemption and kitchen data | One-time coupon redemption, prep sheet, no-show rate, demand forecast |
| 3. Frontend | Booking calendar, QR coupons, staff scanner, kitchen dashboard |
| 4. Polish | Consistent design, responsive layout, demo data |
| 5. Ship | Docker, CI, live deployment |

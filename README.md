# Exam Engine

Exam Engine is a full-stack examination and certification simulation platform. It provides:

- User registration, approval, authentication, and profile history
- Timed, domain-weighted exam simulations
- Automatic answer evaluation and result breakdowns
- Single-choice, multiple-choice, and drag-and-drop matching questions
- Administrative management of users, exams, domains, and questions
- Relationship-aware administration tables for exams, domains, and questions
- Individual question creation and bulk JSON question import
- Reusable modal forms for administration create/edit workflows
- Configurable answer-option counts and validation for all question types
- Server-side search and pagination for administrator user and question listings

## Technology stack

### Frontend

- React 18
- Vite
- React Router
- Tailwind CSS
- Lucide React icons

### Backend

- Node.js
- Express
- PostgreSQL
- `pg`
- JWT authentication
- `bcrypt` password hashing

## Project structure

```text
exam_engine_v3/
├── backend/
│   ├── database.sql         # PostgreSQL schema, enums, constraints, and indexes
│   ├── db.js                # PostgreSQL connection pool
│   ├── init-db.js           # Schema initialization
│   ├── server.js            # Express application entry point
│   ├── middleware/
│   │   └── auth.js          # JWT and administrator authorization
│   ├── migrations/
│   │   └── 20260927_add_drag_and_drop_question_type.sql
│   ├── routes/
│   │   ├── auth.js          # Registration and login
│   │   ├── users.js         # Authenticated user profile
│   │   ├── exams.js         # Exam start and submission
│   │   └── admin.js         # Administrator CRUD and imports
│   └── scripts/
│       ├── bootstrap.js     # Creates the database and applies the schema
│       └── create-admin.js  # Secure, one-time administrator provisioning
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   └── services/api.js
│   ├── index.html
│   └── package.json
└── README.md
```

## Domain model

```text
users
  └── exam_attempts ──> exams

exams
  └── domains
       └── questions
```

### Main tables

| Table | Purpose |
| --- | --- |
| `users` | Registered users, roles, approval status, and authentication data |
| `exams` | Exam configuration, duration, question quota, passing score, and active status |
| `domains` | Weighted syllabus areas belonging to an exam |
| `questions` | Choice and matching questions belonging to a domain |
| `exam_attempts` | User exam sessions, submitted answers, scores, and domain results |

Domains use `weight_percentage` to distribute questions during an exam. Questions store their options and correct answers as JSONB.
Questions support `single_choice`, `multiple_choice`, and `drag_and_drop` types. Questions have between two and eight answer options. Single-choice questions must identify exactly one correct option. Drag-and-drop questions use an even number of options split into prompt and match columns, so they contain 1–4 pairs. `correct_answers` stores each pair as `[prompt_id, match_id]`, for example `[["a", "e"], ["b", "f"], ["c", "g"], ["d", "h"]]`. Every prompt and every match must appear exactly once.

For an existing database, apply `backend/migrations/20260927_add_drag_and_drop_question_type.sql` before deploying the application. For example, with `psql` and `DATABASE_URL` set:

```powershell
psql $env:DATABASE_URL -v ON_ERROR_STOP=1 -f backend\migrations\20260927_add_drag_and_drop_question_type.sql
```

New installations include the type in `backend/database.sql`.

The admin user and question listing endpoints accept `search`, `page`, and `page_size` query parameters (in addition to their existing filters). `page` defaults to `1`, `page_size` defaults to `25` and is capped at `100`. Responses include a `pagination` object with `page`, `page_size`, `total`, and `total_pages`.

Foreign keys use cascade deletion for content relationships:

- Deleting an exam deletes its domains, questions, and attempts.
- Deleting a domain deletes its questions.

The administration interface displays these consequences in delete confirmations.

## Requirements

- Node.js 18 or newer
- npm
- PostgreSQL 14 or newer

## Configuration

Copy `backend/.env.example` to `backend/.env` and replace the placeholders with local values. Generate a unique JWT secret (for example, `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`):

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/exam_engine
JWT_SECRET=replace-with-at-least-32-random-characters
PORT=5000
CORS_ORIGINS=http://localhost:5173
```

The database bootstrap script also supports these variables when a database must be created automatically. `DB_PASSWORD` is required; the script has no default database password:

```env
DB_NAME=exam_engine
DB_USER=postgres
DB_PASSWORD=replace-with-your-postgres-password
DB_HOST=localhost
DB_PORT=5432
```

For the frontend, the API defaults to `http://localhost:5000/api`. To change it, create `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

For production, set `DATABASE_URL`, a unique `JWT_SECRET` of at least 32 characters, and `CORS_ORIGINS` to the exact frontend origin(s), as comma-separated URLs if needed. Store these values in the deployment platform's secret/configuration manager, not in the repository. Never commit `.env` files, database passwords, JWT secrets, or production credentials. The root `.gitignore` excludes local env files, dependencies, and build output.

## Installation

Install backend dependencies from the lockfile:

```powershell
cd backend
npm ci
```

Install frontend dependencies from the lockfile:

```powershell
cd ..\frontend
npm ci
```

## Database setup

### Option 1: Create the database and schema automatically

Configure the PostgreSQL connection variables in `backend/.env`, then run:

```powershell
cd backend
node scripts/bootstrap.js
```

### Option 2: Apply the schema to an existing database

Set `DATABASE_URL` and run:

```powershell
cd backend
node init-db.js
```

`init-db.js` creates the schema. It does not create a default administrator. On an existing database, do not rerun this schema initializer; apply the required SQL migration instead.

To create an administrator intentionally, set `ADMIN_EMAIL` and a unique `ADMIN_PASSWORD` of at least 16 characters (and no more than 72 UTF-8 bytes) in the temporary backend process environment, then run `npm run create-admin`. Do not put these values in source control or pass the password as a command-line argument. The script hashes the password, refuses to overwrite an existing account, and does not print the password. Remove these temporary variables after provisioning.

## Running the application

Start the backend:

```powershell
cd backend
npm run dev
```

The API runs on `http://localhost:5000` by default.

Start the frontend in another terminal:

```powershell
cd frontend
npm run dev
```

Vite prints the frontend URL, normally `http://localhost:5173`.

For a production frontend build:

```powershell
cd frontend
npm run build
npm run preview
```

The backend production command is:

```powershell
cd backend
npm start
```

## Application routes

| Route | Access | Description |
| --- | --- | --- |
| `/login` | Public | User login |
| `/register` | Public | New user registration |
| `/dashboard` | Authenticated | Available exams and attempt history |
| `/exam/:id` | Authenticated | Exam runner |
| `/exam/:id/results` | Authenticated | Exam result review |
| `/profile` | Authenticated | User profile and attempt history |
| `/admin` | Administrator | User, exam, domain, and question management |

New registrations start with `pending` status and cannot log in until approved by an administrator.

## API reference

All API routes are prefixed with `/api`.

Authenticated requests must include:

```http
Authorization: Bearer <jwt-token>
```

### Authentication

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/auth/register` | Register a pending user |
| `POST` | `/auth/login` | Authenticate an approved user and issue a JWT |

Registration body:

```json
{
  "full_name": "Jane Doe",
  "email": "jane@example.com",
  "password": "strong-password"
}
```

### User profile

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/users/profile` | Get the authenticated user's profile and attempts |

### Exam execution

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/exams/:id/start` | Create an attempt and return weighted random questions |
| `POST` | `/exams/:id/submit` | Evaluate answers and complete an attempt |

The start response excludes correct answers and explanations. The submit response includes the score, pass/fail result, and domain-level breakdown.

### Administrator users

All administrator endpoints require an approved JWT whose role is `admin`.

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/admin/users` | List users; supports `status`, `role`, `search`, `page`, and `page_size` |
| `GET` | `/admin/users/pending` | List users awaiting approval |
| `PATCH` | `/admin/users/:id` | Edit name, email, role, or status |
| `PATCH` | `/admin/users/:id/status` | Approve or reject a user |
| `DELETE` | `/admin/users/:id` | Permanently delete a user |

### Administrator exams and domains

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/admin/exams` | Create an exam |
| `GET` | `/admin/exams` | List exams with nested domains and relationship counts |
| `PATCH` | `/admin/exams/:id` | Edit exam configuration |
| `DELETE` | `/admin/exams/:id` | Delete an exam and cascading content |
| `GET` | `/admin/exams/export` | Export all exams as CSV |
| `POST` | `/admin/exams/import` | Create or update exams from CSV |
| `POST` | `/admin/domains` | Create a domain under an exam |
| `GET` | `/admin/domains` | List domains with parent exam and question counts |
| `PATCH` | `/admin/domains/:id` | Edit a domain |
| `DELETE` | `/admin/domains/:id` | Delete a domain and its questions |
| `GET` | `/admin/domains/export` | Export all domains as CSV |
| `POST` | `/admin/domains/import` | Create or update domains from CSV |

### Administrator questions

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/admin/questions` | Create one question |
| `GET` | `/admin/questions` | List questions with exam/domain relationships; supports `search`, `page`, and `page_size` |
| `PATCH` | `/admin/questions/:id` | Edit question content or move it to another domain |
| `DELETE` | `/admin/questions/:id` | Permanently delete a question |
| `POST` | `/admin/questions/bulk` | Import an array of questions in one transaction |
| `GET` | `/admin/questions/export` | Export all questions as CSV |
| `POST` | `/admin/questions/import` | Create or update questions from CSV |

The admin dashboard can export and import CSV files in each Exams, Domains, and Questions tab. Exported files can be edited in a spreadsheet and uploaded again. Keep the `id` column to update a record; leave it blank to insert a new one. Omitted rows are not deleted. Each CSV import is atomic, reports validation errors by row, and accepts up to 5,000 rows and 10 MB.

Import in dependency order: exams, then domains, then questions.

- Exams columns: `id,code,title,description,duration_minutes,total_questions,passing_score_percentage,is_active`. Exam codes must remain unique.
- Domains columns: `id,exam_code,name,weight_percentage`. The parent exam is matched by `exam_code`; weights support up to two decimal places and total domain weight per exam cannot exceed 100%.
- Questions columns: `id,domain_id,exam_code,domain_name,question_text,type,options,correct_answers,explanation,is_active`. `options` and `correct_answers` are JSON arrays. Keep the exported `domain_id`, or leave it blank and match with both `exam_code` and `domain_name`. Supply `domain_id` if the name is ambiguous within an exam.

Spreadsheet software may change JSON values when editing questions. Ensure the `options` and `correct_answers` cells still contain valid JSON arrays before importing.

Example question:

```json
{
  "domain_id": "domain-uuid",
  "question_text": "Which table stores incident records?",
  "type": "single_choice",
  "options": [
    { "id": "a", "text": "incident" },
    { "id": "b", "text": "problem" },
    { "id": "c", "text": "change_request" },
    { "id": "d", "text": "sys_user" }
  ],
  "correct_answers": ["a"],
  "explanation": "Incident records are stored in the incident table."
}
```

Supported question types:

- `single_choice`
- `multiple_choice`
- `drag_and_drop`

For `drag_and_drop`, `options` contains an even number (2–8) of items. The first half are prompts and the second half are match targets. Each prompt and target must have a unique ID, and `correct_answers` must contain exactly one unique pairing for each prompt. For example:

```json
{
  "domain_id": "domain-uuid",
  "question_text": "Match each letter to its position in the alphabet.",
  "type": "drag_and_drop",
  "options": [
    { "id": "a", "text": "A" },
    { "id": "b", "text": "B" },
    { "id": "c", "text": "1st" },
    { "id": "d", "text": "2nd" }
  ],
  "correct_answers": [["a", "c"], ["b", "d"]]
}
```

## Administration workflows

### User management

The administrator dashboard provides server-searched and paginated user and question tables. Reusable modal forms are used for user, exam, domain, and question editing, as well as exam, domain, and question creation. Administrators can edit identity, role, and account status, approve or reject pending registrations, or permanently delete users.

Password hashes are never returned to the frontend. Password changes are not part of the general edit form.

### Exams and domains

The Exams & Domains tabs use relationship tables. Each domain appears beneath its parent exam and exposes its weight. Exam configuration and domain values are edited in reusable modal forms or updated in bulk using CSV export/import.

Domain weights cannot exceed 100% in total for an exam.

### Question management

The Question Manager provides:

- A question form with configurable answer counts (2–8 for choice questions; an even 2–8 for matching questions)
- Drag-and-drop matching key entry, with every prompt assigned a distinct match
- Exam takers can drag a match onto a prompt or select it from an accessible control; grading requires the complete correct set of pairs
- Bulk JSON upload for importing a question array
- CSV export/import for editing the complete question bank in a spreadsheet
- Modal editing for question text, type, domain, options, and correct answers

The question table exposes the parent exam and domain, making relationship navigation visible while editing.

## Security model

- Passwords are hashed with bcrypt.
- Login issues JWTs with an eight-hour expiration.
- Protected routes require a valid bearer token.
- Administrator routes require `role = admin`.
- SQL queries use parameterized values.
- Password hashes are excluded from API responses.
- Input validation is applied to administrator updates.

Before production deployment:

1. Replace the development JWT secret.
2. Remove or change the default local admin credentials.
3. Use a restricted PostgreSQL user.
4. Configure HTTPS and secure deployment secrets.
5. Review CORS configuration instead of using the permissive development default.
6. Add backups before using hard-delete administration actions.

## Validation and development checks

Backend syntax check:

```powershell
node --check backend\routes\admin.js
```

Backend CSV tests:

```powershell
cd backend
npm test
```

Frontend production build:

```powershell
cd frontend
npm run build
```

Health check:

```text
GET http://localhost:5000/health
```

The health endpoint verifies that the Express server can reach PostgreSQL.

## Important operational notes

- Hard deletion is enabled for administrators. Deleting exams or domains can remove dependent historical data because of database cascade rules.
- Exam start requires configured domains and an available active question pool.
- The question selection process uses domain weights and fills remaining quotas from other domains if a weighted pool is underpopulated.
- The frontend stores the JWT and user session in browser local storage.
- PostgreSQL must be running before starting the backend.

## Future improvements

- Add a dedicated public active-exams endpoint for non-admin dashboards.
- Add automated API and end-to-end tests.
- Add password reset and administrator password-change flows.
- Consider archive/deactivation workflows where historical attempts must never be deleted.
- Add audit logging for administrative edits and deletions.

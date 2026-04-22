# Atlas Magnetics Test Task

Full-stack CSV analytics app with a `FastAPI` backend and a `React` + `Vite` frontend.

## What It Does

- accepts one or more `.csv` files
- processes files asynchronously through `Celery`
- sends job status updates through WebSocket
- calculates `mean`, `median`, `min`, and `max` from the `result` column
- returns chart-ready data for `test_id` or `test_name` on the X-axis and `result` on the Y-axis
- handles invalid CSV files gracefully with descriptive errors and stable `error_code` values

## Tech Stack

- `FastAPI` for HTTP and WebSocket APIs
- `Celery` for background processing
- `Redis` as broker and result backend
- `pandas` for chunk-based CSV parsing
- `React` for the frontend UI
- `Vite` for frontend development and bundling
- `Recharts` for chart rendering

## Project Structure

```text
app/
  main.py
  tasks.py
  settings.py
  schemas.py
  exceptions.py
  routes/
    jobs.py
    status.py
  services/
    celery_app.py
    celery_status.py
    csv_processor.py
    upload_storage.py
  scripts/
    analytics.py
frontend/
  src/
  package.json
  vite.config.ts
```

## Environment Variables

Create and fill in the .env file.

Available settings:

- `CELERY_BROKER_URL`
  Redis broker URL used by Celery to queue background jobs.
- `CELERY_RESULT_BACKEND`
  Redis backend URL used by Celery to store task states and final results.
- `STORAGE_DIRECTORY`
  Directory where uploaded CSV files are temporarily stored before processing.
- `CSV_CHUNK_SIZE`
  Number of rows read per chunk by `pandas` while processing large CSV files.
- `CSV_MAX_CHART_POINTS`
  Maximum number of points returned in `chart_data` for frontend chart rendering.
- `CSV_MAX_EXACT_MEDIAN_VALUES`
  Maximum number of `result` values for which the service calculates an exact median.
- `CSV_MAX_MEDIAN_SAMPLE_SIZE`
  Maximum reservoir sample size used when the service switches to approximate median calculation for very large files.

## Local Run

Create and activate a virtual environment:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install --upgrade pip
pip install -r requirements.txt
```

Start the API:

```bash
uvicorn app.main:app --reload
```

Start the worker:

```bash
python -m celery -A app.services.celery_app:celery_app worker --loglevel=info
```

### Frontend

Install frontend dependencies:

```bash
cd frontend
npm install
```

Start the frontend dev server:

```bash
cd frontend
npm run dev
```

The frontend will be available at:

```text
http://127.0.0.1:5173
```

The Vite dev server proxies API and WebSocket requests to `http://localhost:8000`, so the backend API and Celery worker should already be running before you use the UI.

## API Endpoints

### `POST /jobs`

Accepts one or more `.csv` files and creates a background job.

### `GET /jobs/{job_id}`

Returns job state, error details, and final analytics per file.

### `WS /ws/jobs/{job_id}`

Streams lightweight processing status updates.

## CSV Requirements

Each CSV file must contain:

- `result`
- one of:
  - `test_id`
  - `test_name`
  - `index`

## Response Notes

- each uploaded file gets its own report inside `results`
- `chart_data` is sampled for large files to keep payloads manageable
- `median_is_approximate` becomes `true` when the service switches to sampled median estimation for very large datasets

## Documentations

Open Swagger UI:

```text
http://127.0.0.1:8000/docs
```

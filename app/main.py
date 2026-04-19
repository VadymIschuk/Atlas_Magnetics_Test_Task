from fastapi import FastAPI

from app.routes.jobs import router as jobs_router
from app.routes.status import router as status_router


app = FastAPI(title="Atlas Magnetics CSV Processor")
app.include_router(jobs_router)
app.include_router(status_router)


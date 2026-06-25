import asyncio
import logging
import os
from typing import Optional

from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel

from .runner import run_test

logger = logging.getLogger(__name__)

app = FastAPI(title='Gotryl Executor', version='0.1.0')

_SECRET = os.environ.get('INTERNAL_SERVICE_SECRET', '')
if not _SECRET:
    raise RuntimeError(
        'INTERNAL_SERVICE_SECRET env var is required — executor cannot start without it'
    )

_R2_VARS = ('R2_BUCKET', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_ENDPOINT')
_missing_r2 = [v for v in _R2_VARS if not os.environ.get(v)]
if _missing_r2:
    logger.warning('R2 not fully configured — artifact upload disabled. Missing: %s', ', '.join(_missing_r2))


class ExecuteRequest(BaseModel):
    runId: str
    testCode: str
    targetUrl: str


@app.get('/v1/health')
def health():
    return {'status': 'ok'}


@app.post('/v1/execute')
async def execute(
    body: ExecuteRequest,
    x_internal_secret: Optional[str] = Header(None, alias='x-internal-secret'),
):
    if x_internal_secret != _SECRET:
        raise HTTPException(status_code=401, detail='Unauthorized')

    logger.info('Starting execution: runId=%s targetUrl=%s', body.runId, body.targetUrl)
    result = await asyncio.to_thread(run_test, body.runId, body.testCode, body.targetUrl)
    logger.info(
        'Execution complete: runId=%s status=%s durationMs=%s',
        body.runId,
        result['status'],
        result['durationMs'],
    )
    return result

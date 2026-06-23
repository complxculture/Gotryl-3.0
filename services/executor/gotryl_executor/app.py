import logging
import os
from typing import Optional

from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel

from .runner import run_test

logger = logging.getLogger(__name__)

app = FastAPI(title='Gotryl Executor', version='0.1.0')

_SECRET = os.environ.get('INTERNAL_SERVICE_SECRET', '')


class ExecuteRequest(BaseModel):
    runId: str
    testCode: str
    targetUrl: str


@app.get('/v1/health')
def health():
    return {'status': 'ok'}


@app.post('/v1/execute')
def execute(
    body: ExecuteRequest,
    x_internal_secret: Optional[str] = Header(None, alias='x-internal-secret'),
):
    if _SECRET and x_internal_secret != _SECRET:
        raise HTTPException(status_code=401, detail='Unauthorized')

    logger.info('Starting execution: runId=%s targetUrl=%s', body.runId, body.targetUrl)
    result = run_test(body.testCode, body.targetUrl)
    logger.info(
        'Execution complete: runId=%s status=%s durationMs=%s',
        body.runId,
        result['status'],
        result['durationMs'],
    )
    return result

import logging
import os
from pathlib import Path

logger = logging.getLogger(__name__)

_R2_BUCKET = os.environ.get('R2_BUCKET', '')
_R2_ACCESS_KEY_ID = os.environ.get('R2_ACCESS_KEY_ID', '')
_R2_SECRET_ACCESS_KEY = os.environ.get('R2_SECRET_ACCESS_KEY', '')
_R2_ENDPOINT = os.environ.get('R2_ENDPOINT', '')

_R2_CONFIGURED = all([_R2_BUCKET, _R2_ACCESS_KEY_ID, _R2_SECRET_ACCESS_KEY, _R2_ENDPOINT])


def _client():
    import boto3
    return boto3.client(
        's3',
        endpoint_url=_R2_ENDPOINT,
        aws_access_key_id=_R2_ACCESS_KEY_ID,
        aws_secret_access_key=_R2_SECRET_ACCESS_KEY,
        region_name='auto',
    )


def upload_run_artifacts(run_id: str, artifacts_dir: str) -> None:
    """Upload all captured artifacts to R2 under runs/{run_id}/…

    Best-effort: logs warnings on failure, never raises.
    No-op when R2 is not configured.
    """
    if not _R2_CONFIGURED:
        logger.debug('R2 not configured — skipping artifact upload for run %s', run_id)
        return

    base = Path(artifacts_dir)
    if not base.exists():
        return

    client = _client()

    steps_dir = base / 'steps'
    if steps_dir.exists():
        for step_dir in sorted(steps_dir.iterdir(), key=lambda p: int(p.name) if p.name.isdigit() else 0):
            for filename in ('screenshot.png', 'dom.html'):
                local = step_dir / filename
                if local.exists():
                    key = f'runs/{run_id}/steps/{step_dir.name}/{filename}'
                    _upload(client, str(local), key)

    for video_file in sorted(base.glob('*.webm')):
        key = f'runs/{run_id}/{video_file.name}'
        _upload(client, str(video_file), key)


def upload_failure_bundle(run_id: str, bundle: dict) -> None:
    """Upload failure-bundle.json to R2. Best-effort; never raises."""
    if not _R2_CONFIGURED:
        logger.debug('R2 not configured — skipping bundle upload for run %s', run_id)
        return
    import json
    client = _client()
    key = f'runs/{run_id}/failure-bundle.json'
    body = json.dumps(bundle, ensure_ascii=False).encode('utf-8')
    try:
        client.put_object(Bucket=_R2_BUCKET, Key=key, Body=body, ContentType='application/json')
        logger.debug('Uploaded failure bundle: %s', key)
    except Exception as exc:
        logger.warning('Failed to upload failure bundle %s: %s', key, exc)


def _upload(client, local_path: str, key: str) -> None:
    try:
        client.upload_file(local_path, _R2_BUCKET, key)
        logger.debug('Uploaded artifact: %s', key)
    except Exception as exc:
        logger.warning('Failed to upload artifact %s: %s', key, exc)

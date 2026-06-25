import logging
import re
import secrets
from pathlib import Path

logger = logging.getLogger(__name__)


def mint_snapshot_id() -> str:
    # secrets.token_urlsafe(12) produces 16 base64url chars — matches snap_ convention
    return f'snap_{secrets.token_urlsafe(12)}'


def assemble_failure_bundle(
    run_id: str,
    artifacts_dir: str,
    test_code: str,
    stdout: str,
    stderr: str,
) -> dict:
    """Build the failure bundle dict. Caller is responsible for uploading to R2."""
    snapshot_id = mint_snapshot_id()
    base = Path(artifacts_dir)

    screenshot_r2_keys: list[str] = []
    steps_dir = base / 'steps'
    if steps_dir.exists():
        for step_dir in sorted(
            steps_dir.iterdir(),
            key=lambda p: int(p.name) if p.name.isdigit() else 0,
        ):
            if (step_dir / 'screenshot.png').exists():
                screenshot_r2_keys.append(f'runs/{run_id}/steps/{step_dir.name}/screenshot.png')

    dom_snapshot = ''
    if steps_dir.exists():
        step_dirs = sorted(
            (p for p in steps_dir.iterdir() if p.is_dir()),
            key=lambda p: int(p.name) if p.name.isdigit() else 0,
        )
        if step_dirs:
            dom_file = step_dirs[-1] / 'dom.html'
            if dom_file.exists():
                try:
                    dom_snapshot = dom_file.read_text(encoding='utf-8')
                except Exception as exc:
                    logger.warning('Could not read DOM snapshot for run %s: %s', run_id, exc)

    # Extract line number from pytest --tb=short output: "test_run.py:15: AssertionError"
    line_no = 0
    combined = (stdout or '') + '\n' + (stderr or '')
    m = re.search(r'test_run\.py:(\d+)(?::|$)', combined, re.MULTILINE)
    if m:
        line_no = int(m.group(1))

    return {
        'snapshotId': snapshot_id,
        'failingStep': {'lineNo': line_no, 'actionType': 'unknown', 'selector': ''},
        'screenshotUrls': screenshot_r2_keys,
        'domSnapshot': dom_snapshot,
        'neighboringSteps': [],
        'testSource': test_code or '',
    }

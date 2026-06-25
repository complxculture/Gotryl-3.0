import logging
import os
import signal
import subprocess
import tempfile
import time

logger = logging.getLogger(__name__)

CONFTEST_TEMPLATE = '''\
import os
import pytest

_ARTIFACTS_DIR = os.environ.get('GOTRYL_ARTIFACTS_DIR', '')
_step_counter = {'n': 0}


@pytest.fixture
async def _gotryl_page():
    """Gotryl-injected page fixture: records video, captures screenshot+DOM per test."""
    if not _ARTIFACTS_DIR:
        from playwright.async_api import async_playwright
        async with async_playwright() as pw:
            browser = await pw.chromium.launch()
            ctx = await browser.new_context()
            p = await ctx.new_page()
            yield p
            await ctx.close()
            await browser.close()
        return

    from playwright.async_api import async_playwright

    idx = _step_counter['n']
    _step_counter['n'] += 1

    video_dir = os.path.join(_ARTIFACTS_DIR, 'videos')
    os.makedirs(video_dir, exist_ok=True)

    async with async_playwright() as pw:
        browser = await pw.chromium.launch()
        ctx = await browser.new_context(record_video_dir=video_dir)
        p = await ctx.new_page()

        yield p

        step_dir = os.path.join(_ARTIFACTS_DIR, 'steps', str(idx))
        os.makedirs(step_dir, exist_ok=True)
        try:
            await p.screenshot(path=os.path.join(step_dir, 'screenshot.png'))
        except Exception:
            pass
        try:
            with open(os.path.join(step_dir, 'dom.html'), 'w', encoding='utf-8') as fh:
                fh.write(await p.content())
        except Exception:
            pass

        video_path = None
        try:
            video_path = await p.video.path()
        except Exception:
            pass

        await ctx.close()
        await browser.close()

        if video_path and os.path.exists(video_path):
            import shutil
            dest = os.path.join(_ARTIFACTS_DIR, f'video_{idx}.webm')
            shutil.move(video_path, dest)
'''


def run_test(run_id: str, test_code: str | None, test_description: str, target_url: str) -> dict:
    """Execute a Python Playwright test file and return a structured result."""
    start_ms = int(time.time() * 1000)
    generated_code = None

    if not test_code:
        try:
            from .generator import generate_test_code
            test_code = generate_test_code(test_description, target_url, sequence=1)
            generated_code = test_code
        except Exception as e:
            logger.error('Code generation failed for run %s: %s', run_id, e)
            return {
                'status': 'error',
                'steps': [],
                'durationMs': int(time.time() * 1000) - start_ms,
                'error': f'Code generation failed: {e}',
                'stdout': '',
                'stderr': '',
            }

    with tempfile.TemporaryDirectory() as tmpdir:
        test_file = os.path.join(tmpdir, 'test_run.py')
        with open(test_file, 'w') as f:
            f.write(test_code)

        conftest_file = os.path.join(tmpdir, 'conftest.py')
        with open(conftest_file, 'w') as f:
            f.write(CONFTEST_TEMPLATE)

        artifacts_dir = os.path.join(tmpdir, 'artifacts')
        os.makedirs(artifacts_dir, exist_ok=True)

        env = {**os.environ, 'TARGET_URL': target_url, 'GOTRYL_ARTIFACTS_DIR': artifacts_dir}

        try:
            proc = subprocess.Popen(
                ['python', '-m', 'pytest', test_file, '--tb=short', '-q', '--no-header', '--asyncio-mode=auto'],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                env=env,
                cwd=tmpdir,
                preexec_fn=os.setsid,
            )
            try:
                stdout, stderr = proc.communicate(timeout=120)
                returncode = proc.returncode
            except subprocess.TimeoutExpired:
                try:
                    os.killpg(os.getpgid(proc.pid), signal.SIGKILL)
                except ProcessLookupError:
                    proc.kill()
                proc.communicate()
                logger.error('Test execution timed out after 120 seconds')
                return {
                    'status': 'error',
                    'steps': [],
                    'durationMs': 120000,
                    'error': 'Test execution timed out after 120 seconds',
                    'stdout': '',
                    'stderr': '',
                }

            duration_ms = int(time.time() * 1000) - start_ms

            # pytest exit codes: 0=passed, 1=some failed, 2=interrupted, 3+=internal/usage/no-tests
            if returncode == 0:
                status = 'passed'
            elif returncode == 1:
                status = 'failed'
            else:
                status = 'error'

            logger.debug('pytest exit=%d duration=%dms', returncode, duration_ms)

            try:
                from .r2 import upload_run_artifacts
                upload_run_artifacts(run_id, artifacts_dir)
            except Exception as exc:
                logger.warning('Artifact upload error for run %s: %s', run_id, exc)

            result = {
                'status': status,
                'steps': [],
                'durationMs': duration_ms,
                'stdout': stdout,
                'stderr': stderr,
            }
            if generated_code is not None:
                result['generatedCode'] = generated_code
            return result
        except Exception as e:
            duration_ms = int(time.time() * 1000) - start_ms
            logger.error('Unexpected runner error: %s', e)
            return {
                'status': 'error',
                'steps': [],
                'durationMs': duration_ms,
                'error': str(e),
                'stdout': '',
                'stderr': '',
            }

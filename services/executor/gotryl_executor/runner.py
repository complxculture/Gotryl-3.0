import logging
import os
import subprocess
import tempfile
import time

logger = logging.getLogger(__name__)


def run_test(test_code: str, target_url: str) -> dict:
    """Execute a Python Playwright test file and return a structured result."""
    start_ms = int(time.time() * 1000)

    with tempfile.TemporaryDirectory() as tmpdir:
        test_file = os.path.join(tmpdir, 'test_run.py')
        with open(test_file, 'w') as f:
            f.write(test_code)

        env = {**os.environ, 'TARGET_URL': target_url}

        try:
            result = subprocess.run(
                ['python', '-m', 'pytest', test_file, '-v', '--tb=short', '-q', '--no-header'],
                capture_output=True,
                text=True,
                timeout=120,
                env=env,
                cwd=tmpdir,
            )
            duration_ms = int(time.time() * 1000) - start_ms

            # pytest exit codes: 0=passed, 1=some failed, 2=interrupted, 3+=internal/usage/no-tests
            if result.returncode == 0:
                status = 'passed'
            elif result.returncode == 1:
                status = 'failed'
            else:
                status = 'error'

            logger.debug('pytest exit=%d duration=%dms', result.returncode, duration_ms)
            return {
                'status': status,
                'steps': [],
                'durationMs': duration_ms,
                'stdout': result.stdout,
                'stderr': result.stderr,
            }
        except subprocess.TimeoutExpired:
            logger.error('Test execution timed out after 120 seconds')
            return {
                'status': 'error',
                'steps': [],
                'durationMs': 120000,
                'error': 'Test execution timed out after 120 seconds',
                'stdout': '',
                'stderr': '',
            }
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

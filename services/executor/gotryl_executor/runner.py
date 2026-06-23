import logging
import os
import signal
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
            return {
                'status': status,
                'steps': [],
                'durationMs': duration_ms,
                'stdout': stdout,
                'stderr': stderr,
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

import json
import logging
import os

logger = logging.getLogger(__name__)

_MODEL = 'claude-haiku-4-5-20251001'


def analyze_failure(
    test_source: str,
    stdout: str,
    stderr: str,
    failing_line_no: int,
    dom_snapshot: str = '',
) -> dict:
    """Call claude-haiku to produce rootCauseHypothesis and fixTarget.

    Returns dict with keys rootCauseHypothesis (str) and fixTarget (dict | None).
    Returns empty dict on any error — bundle upload must never be blocked.
    """
    api_key = os.environ.get('ANTHROPIC_API_KEY', '')
    if not api_key:
        logger.debug('ANTHROPIC_API_KEY not set — skipping failure analysis')
        return {}

    dom_excerpt = dom_snapshot[:3000] if dom_snapshot else ''

    prompt = f"""You are a Playwright test failure analyst. Given a failing test, produce a concise root-cause hypothesis.

## Test source
```python
{test_source}
```

## pytest output
```
{(stdout + stderr)[:3000]}
```

## DOM snapshot at failure (truncated)
```html
{dom_excerpt}
```

The test failed at approximately line {failing_line_no}.

Respond ONLY with a valid JSON object (no markdown, no explanation) matching this schema:
{{
  "rootCauseHypothesis": "<1-2 sentence explanation of why the test failed>",
  "fixTarget": {{
    "file": "test_run.py",
    "lineRange": [<start_line>, <end_line>]
  }}
}}

If you cannot determine a fixTarget, set it to null."""

    try:
        from anthropic import Anthropic
        client = Anthropic(api_key=api_key)
        response = client.messages.create(
            model=_MODEL,
            max_tokens=512,
            messages=[{'role': 'user', 'content': prompt}],
        )
        raw = response.content[0].text.strip()
        # Strip accidental markdown fences
        if raw.startswith('```'):
            raw = raw.split('\n', 1)[1].rsplit('```', 1)[0].strip()
        return json.loads(raw)
    except Exception as exc:
        logger.warning('Failure analysis error: %s', exc)
        return {}

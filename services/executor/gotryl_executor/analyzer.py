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
    target_url: str = '',
) -> dict:
    """Call claude-haiku to produce a plain-English rootCauseHypothesis and whatToDoNext.

    Returns dict with keys rootCauseHypothesis (str) and whatToDoNext (str).
    Returns empty dict on any error — bundle upload must never be blocked.
    """
    api_key = os.environ.get('ANTHROPIC_API_KEY', '')
    if not api_key:
        logger.debug('ANTHROPIC_API_KEY not set — skipping failure analysis')
        return {}

    dom_excerpt = dom_snapshot[:3000] if dom_snapshot else ''
    output_excerpt = ((stdout or '') + (stderr or ''))[:3000]
    url_hint = f' at {target_url}' if target_url else ''

    prompt = f"""You are helping a non-technical founder understand why their automated browser test failed.

They built their app on a no-code platform (like Lovable or Bolt) and have never written code.
Your job is to explain the failure in plain English — no Playwright terms, no Python, no CSS selectors, no stack traces.

## What the test was checking
{test_source[:1500]}

## What the test runner reported (raw — do NOT quote this in your answer)
{output_excerpt}

## What the page looked like when it failed (HTML excerpt)
{dom_excerpt}

The failure happened around line {failing_line_no} of the test.
The app URL being tested{url_hint}.

Respond ONLY with a valid JSON object (no markdown fences, no explanation):
{{
  "rootCauseHypothesis": "<1-2 plain-English sentences explaining what failed and likely why — written for someone who has never written code. No technical jargon, no selector names, no Python terms.>",
  "whatToDoNext": "<1-3 short, concrete steps the user can take to investigate or fix this. Reference the actual app URL if helpful. No code. No jargon. Each step on its own line.>"
}}

Examples of GOOD rootCauseHypothesis:
- "The sign-up button couldn't be found on the page. This usually happens when a button's label or design was recently changed in your app."
- "The test tried to click 'Add to Cart' but the page hadn't finished loading yet. Your app may be slower than expected on this URL."

Examples of BAD rootCauseHypothesis (do NOT write like this):
- "locator.click() timed out after 5000ms on selector .submit-btn"
- "AssertionError: expected element to be visible but got hidden"
"""

    try:
        from anthropic import Anthropic
        client = Anthropic(api_key=api_key)
        response = client.messages.create(
            model=_MODEL,
            max_tokens=512,
            messages=[{'role': 'user', 'content': prompt}],
        )
        raw = response.content[0].text.strip()
        if raw.startswith('```'):
            parts = raw.split('\n', 1)
            if len(parts) > 1:
                raw = parts[1].rsplit('```', 1)[0].strip()
        return json.loads(raw)
    except Exception as exc:
        logger.warning('Failure analysis error: %s', exc)
        return {}

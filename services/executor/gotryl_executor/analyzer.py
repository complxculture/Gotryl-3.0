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

They built their app on a no-code platform (like Lovable or Bolt) and have NEVER written code.
Imagine you are explaining this to a smart friend who uses apps every day but has no idea how websites are built.

STRICT RULES — violating these makes your answer useless:
- NEVER mention HTML tags like <nav>, <div>, <header>, <main>, <span>, or any tag with angle brackets
- NEVER mention CSS, selectors, locators, or class names
- NEVER mention Python, pytest, async, await, or any programming term
- NEVER mention Playwright, timeouts, assertions, or test framework terms
- NEVER quote error messages or stack traces
- DO talk about what the user would SEE and DO on their website — buttons, links, menus, forms, pages

## What the test was checking
{test_source[:1500]}

## What the test runner reported (raw — do NOT quote or repeat this in your answer)
{output_excerpt}

## What the page looked like when it failed (raw code — do NOT mention this in your answer)
{dom_excerpt}

The failure happened around line {failing_line_no} of the test.
The app URL being tested{url_hint}.

Respond ONLY with a valid JSON object (no markdown fences, no explanation):
{{
  "rootCauseHypothesis": "<1-2 plain-English sentences: what part of the app couldn't be found or didn't work, and the most likely everyday reason why. Speak like a friend, not a developer.>",
  "whatToDoNext": "<1-3 short action steps the user can actually take. No code, no jargon. Each step on its own line. Reference the app URL{url_hint} if helpful.>"
}}

Examples of GOOD rootCauseHypothesis:
- "The navigation menu couldn't be found on the page. This usually happens when a menu was recently redesigned or moved in your app."
- "The 'Add to Cart' button wasn't visible when the test looked for it. Your page may have been loading slowly or the button's label may have changed."
- "The sign-up form wasn't found. If you recently updated your app's design, the form may have been renamed or removed."

Examples of BAD rootCauseHypothesis (NEVER write like these):
- "The <nav> or [role='navigation'] element was not found in the DOM"
- "locator.click() timed out after 5000ms on selector .submit-btn"
- "AssertionError: expected element to be visible"
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

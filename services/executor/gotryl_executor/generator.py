import logging
import os
import re

logger = logging.getLogger(__name__)


def generate_test_code(description: str, target_url: str, sequence: int = 1) -> str:
    """Generate a Python Playwright pytest file from a natural-language description."""
    api_key = os.environ.get('ANTHROPIC_API_KEY', '')
    if not api_key:
        raise RuntimeError('ANTHROPIC_API_KEY is required for test code generation')

    from anthropic import Anthropic

    slug = re.sub(r'[^a-z0-9]+', '_', description.lower()).strip('_')[:50]
    filename = f'TC{sequence:03d}_{slug}.py'

    client = Anthropic(api_key=api_key)
    response = client.messages.create(
        model='claude-sonnet-4-6',
        max_tokens=4096,
        messages=[{
            'role': 'user',
            'content': (
                f'Generate a Python pytest file named `{filename}` that tests:\n\n'
                f'BEHAVIOR: {description}\n'
                f'TARGET URL: {target_url}\n\n'
                'REQUIREMENTS:\n'
                '- Import: `import os, pytest`\n'
                f'- Get URL: `TARGET_URL = os.environ.get("TARGET_URL", "{target_url}")`\n'
                '- Use `_gotryl_page` as the fixture parameter name (NOT `page`) — '
                'it is injected by the test runner conftest with video recording\n'
                '- Test functions must start with `test_` and be `async def`\n'
                '- asyncio-mode=auto is set — no need for @pytest.mark.asyncio\n'
                '- Navigation: `await _gotryl_page.goto(TARGET_URL, timeout=10000)`\n'
                '- Include meaningful `expect` assertions\n'
                '- Return ONLY Python code, no markdown fences, no explanation'
            ),
        }],
    )

    code = response.content[0].text.strip()
    logger.info('Generated %d chars of test code for: %s', len(code), description[:60])
    return code

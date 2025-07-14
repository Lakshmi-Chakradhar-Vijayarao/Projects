def assemble_resume(parts: dict, summary_edit=None) -> str:
    summary = summary_edit or parts.get("craft_hook", "")
    return f"""
# Optimized Resume

## Summary
{summary}

## Experience
{parts.get('upgrade_experience', '')}

## ATS Keywords Applied
{parts.get('ats_boost', '')}

## Tailored Version
{parts.get('tailor_for_role', '')}

## Suggested Formatting
{parts.get('format_fix', '')}

## Additional Notes
- Flaws Spotted: {parts.get('spot_flaws', '')}
- Benchmark Insights: {parts.get('benchmark_me', '')}
"""

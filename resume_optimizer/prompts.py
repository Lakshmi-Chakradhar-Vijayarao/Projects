PROMPT_TEMPLATES = {
    "spot_flaws": """You are a recruiter. Spot 5 flaws in the following resume for a {role} role:\n\n{resume}""",
    "rewrite_for_impact": """Rewrite the resume for a more results-driven, compelling version tailored to {role}:\n\n{resume}""",
    "ats_boost": """Make this resume ATS-optimized for a {role} role using relevant keywords:\n\n{resume}""",
    "craft_hook": """Write a 3-line summary for this resume targeting the role of {role}:\n\n{resume}""",
    "upgrade_experience": """Rephrase the experience section with impact, results, and metrics for a {role} role:\n\n{resume}""",
    "format_fix": """Suggest a clean format for the resume suitable for ATS:\n\n{resume}""",
    "tailor_for_role": """Tailor this resume for the following job description:\n\nResume:\n{resume}\n\nJob Description:\n{jd}""",
    "benchmark_me": """Compare this resume to a top 1% candidate for the following role. Suggest improvements:\n\nRole: {role}\n\nResume:\n{resume}\n\nJD:\n{jd}"""
}

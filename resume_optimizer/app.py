import streamlit as st
from resume_to_text import extract_text
from prompts import PROMPT_TEMPLATES
from gpt_engine import run_prompt
from pdf_generator import save_text_as_pdf

st.set_page_config(page_title="AI Resume Optimizer", layout="centered")
st.title("🧠 AI Resume Optimizer (100% Free via Hugging Face)")
st.markdown("Upload your resume, paste a job description, and get an enhanced, ATS-ready PDF resume!")

uploaded_resume = st.file_uploader("📄 Upload your Resume", type=["pdf", "docx"])
job_description = st.text_area("📝 Paste the Job Description", height=200)
target_role = st.text_input("🎯 Enter Target Role or Job Title")

if st.button("🚀 Optimize Resume"):
    if not uploaded_resume or not job_description or not target_role:
        st.warning("Please upload resume, enter job description, and target role.")
        st.stop()

    resume_text = extract_text(uploaded_resume)
    if not resume_text.strip():
        st.error("Could not extract any text from the uploaded file.")
        st.stop()

    st.info("Starting optimization...")
    current_text = resume_text
    steps = list(PROMPT_TEMPLATES.keys())
    progress = st.progress(0)

    for i, step in enumerate(steps):
        with st.spinner(f"Running: {step.replace('_', ' ').title()}"):
            prompt = PROMPT_TEMPLATES[step].format(resume=current_text, jd=job_description, role=target_role)
            current_text = run_prompt(prompt)
            st.success(f"Step {i+1}/{len(steps)}: {step.replace('_', ' ').title()} ✅")
            progress.progress((i + 1) / len(steps))

    st.success("🎉 All steps completed. Your resume is ready!")

    pdf_path = save_text_as_pdf(current_text)
    print("LLM Output:", current_text)

    with open(pdf_path, "rb") as f:
        st.download_button("📥 Download Enhanced Resume", f, file_name="optimized_resume.pdf")

from fpdf import FPDF
import os
import tempfile

# Use macOS system font that supports Unicode
FONT_PATH = "/System/Library/Fonts/Supplemental/Arial Unicode.ttf"

def save_text_as_pdf(text, filename="optimized_resume.pdf"):
    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=10)
    pdf.add_page()

    if os.path.exists(FONT_PATH):
        pdf.add_font("ArialUnicode", "", FONT_PATH, uni=True)
        pdf.set_font("ArialUnicode", size=11)
    else:
        pdf.set_font("Helvetica", size=11)

    for line in text.strip().split("\n"):
        pdf.multi_cell(0, 10, line.strip())
        pdf.ln()

    output_path = os.path.join(tempfile.gettempdir(), filename)
    pdf.output(output_path)
    return output_path

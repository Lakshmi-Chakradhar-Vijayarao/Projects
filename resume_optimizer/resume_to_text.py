import io
from docx import Document
import fitz  # PyMuPDF

def extract_text_from_file(uploaded_file):
    file_type = uploaded_file.name.split('.')[-1].lower()

    if file_type == "txt":
        return uploaded_file.read().decode("utf-8")

    elif file_type == "docx":
        doc = Document(uploaded_file)
        return "\n".join([para.text for para in doc.paragraphs])

    elif file_type == "pdf":
        text = ""
        with fitz.open(stream=uploaded_file.read(), filetype="pdf") as doc:
            for page in doc:
                text += page.get_text()
        return text

    else:
        return None

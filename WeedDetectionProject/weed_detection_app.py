import streamlit as st
import torch
from PIL import Image
import numpy as np
import io
import pandas as pd
import base64
import av
import uuid
import cv2
from streamlit_webrtc import webrtc_streamer, VideoTransformerBase


# Page configuration
st.set_page_config(page_title="Weed Detection App", layout="centered")

# Load custom CSS styles
with open("assets/style.css") as f:
    st.markdown(f"<style>{f.read()}</style>", unsafe_allow_html=True)

# Function to set background image from local file
def set_bg_from_local(image_file):
    with open(image_file, "rb") as image:
        encoded = base64.b64encode(image.read()).decode()
    st.markdown(
        f"""
        <style>
        .stApp {{
            background-image: url("data:image/jpeg;base64,{encoded}");
            background-size: cover;
            background-attachment: fixed;
            background-position: center;
        }}
        </style>
        """,
        unsafe_allow_html=True
    )

# Call it with your file
set_bg_from_local("assets/skyimage.jpeg")

# 🌿 Add custom background
st.markdown(
    """
    <style>
    /* Set sky image as background */
    body {
        background-image: url("https://raw.githubusercontent.com/SathwikaaDevarapalli16/WeedDetection/blob/main/skyimage.jpesg");
        background-size: cover;
        background-repeat: no-repeat;
        background-position: center;
        background-attachment: fixed;
    }

    /* Make main content stand out */
    .main > div {
        background-color: rgba(255, 255, 255, 0.85);
        padding: 1.5rem;
        border-radius: 12px;
        box-shadow: 0 0 12px rgba(0,0,0,0.2);
        margin-top: 2rem;
    }

    /* Optional: Make sidebar text visible */
    .css-1d391kg, .css-qrbaxs, .css-1cpxqw2 {
        color: #ffffff !important;
    }

    .stSlider > div > div {
        background-color: rgba(255,255,255,0.1);
    }
    </style>
    """,
    unsafe_allow_html=True
)






# App title and description
st.markdown("""
<div class="title-box">
    <h1>🌿 Crop and Weed Detection App</h1>
</div>
""", unsafe_allow_html=True)

st.markdown("Upload an image to detect crops and weed types using YOLOv5.")

# Sidebar for model options
st.sidebar.header("Model Settings")
confidence_threshold = st.sidebar.slider("Confidence Threshold", 0.05, 1.0, 0.1, 0.05)

# Load YOLOv5 model
@st.cache_resource
def load_model():
    model = torch.hub.load('ultralytics/yolov5', 'custom',
                           path='yolov5/runs/train/tuned_run2/weights/best.pt', force_reload=True)
    return model

model = load_model()
model.conf = confidence_threshold

# File uploader
uploaded_file = st.file_uploader("Choose an image...", type=["jpg", "jpeg", "png"])

if uploaded_file is not None:
    image = Image.open(uploaded_file).convert('RGB')

    # Run detection
    with st.spinner('Detecting objects...'):
        results = model(image)
        result_image = np.squeeze(results.render())

        # Get class names and counts
        class_names = results.names
        class_counts = {}
        for *box, conf, cls in results.xyxy[0]:
            label = class_names[int(cls)]
            class_counts[label] = class_counts.get(label, 0) + 1

    st.success("✅ Detection complete!")

    # Columns layout
    col1, col2 = st.columns(2)
    with col1:
        st.image(image, caption='📤 Uploaded Image', use_column_width=True)
    with col2:
        st.image(result_image, caption='🎯 Predicted Image', use_column_width=True)

    # Show class summary
    st.subheader("📊 Detection Summary")
    if class_counts:
        summary_df = pd.DataFrame(list(class_counts.items()), columns=["Class", "Count"])
        st.table(summary_df)
    else:
        st.info("No objects detected with the current confidence threshold.")

    # Download button for result
    result_pil = Image.fromarray(result_image)
    buf = io.BytesIO()
    result_pil.save(buf, format="PNG")
    byte_im = buf.getvalue()
    st.download_button(label="📥 Download Result Image",
                       data=byte_im,
                       file_name="predicted_result.png",
                       mime="image/png")
else:
    st.info("👈 Upload an image from the sidebar or above to get started!")


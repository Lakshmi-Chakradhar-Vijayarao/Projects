import tensorflow as tf
import pandas as pd
import numpy as np
import os
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.models import load_model

# CONFIGURATION
TEST_DIR = "mushrooms_test"          # Directory containing test images
CSV_PATH = "mushrooms_test.csv"      # CSV file with image paths and labels
MODEL_PATH = "mushroom_model.h5"     # Your saved model

# CLASSES (alphabetical order as specified)
CLASSES = ['Agaricus', 'Amanita', 'Boletus', 'Cortinarius',
           'Entoloma', 'Hygrocybe', 'Lactarius', 'Russula', 'Suillus']

# IMAGE SETTINGS
IMG_SIZE = (224, 224)
BATCH_SIZE = 32

# STEP 1: Read CSV
df_test = pd.read_csv(CSV_PATH)

# Ensure required columns exist
if 'image_path' not in df_test.columns or 'label' not in df_test.columns:
    raise ValueError("CSV file must contain 'image_path' and 'label' columns.")

# Extract filenames from image paths (e.g., mushrooms_test/test1.jpg → test1.jpg)
df_test['filename'] = df_test['image_path'].apply(lambda x: os.path.basename(x))
df_test['label'] = df_test['label'].astype(str)

# STEP 2: Define test ImageDataGenerator (no augmentation for test)
test_datagen = ImageDataGenerator(rescale=1.0 / 255)

# STEP 3: Create test generator
test_generator = test_datagen.flow_from_dataframe(
    dataframe=df_test,
    directory=TEST_DIR,
    x_col='filename',
    y_col='label',
    target_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    shuffle=False,
    classes=CLASSES
)

# STEP 4: Load the trained model
print("📥 Loading model from:", MODEL_PATH)
model = load_model(MODEL_PATH)

# STEP 5: Predict
print("🔍 Predicting test images...")
pred_probs = model.predict(test_generator)
pred_classes = np.argmax(pred_probs, axis=1)
true_classes = test_generator.classes

# STEP 6: Evaluate
accuracy = np.mean(pred_classes == true_classes)
print(f"Overall Test Accuracy: {accuracy * 100:.2f}%")

# Optional: Display predictions per image
print("\n🔎 Per-image prediction results:")
for i in range(len(df_test)):
    filename = df_test.iloc[i]['filename']
    true_label = df_test.iloc[i]['label']
    pred_label = CLASSES[pred_classes[i]]
    result = " Correct" if true_label == pred_label else " Incorrect"
    print(f"{filename} | True: {true_label} | Pred: {pred_label} | {result}")

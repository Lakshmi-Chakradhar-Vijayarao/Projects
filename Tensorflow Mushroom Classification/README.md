# Mushroom Species Classification via Transfer Learning (TensorFlow)

This project implements **transfer learning** using TensorFlow to classify mushroom images into 9 species. The dataset includes labeled mushroom images for training and a separate test set for evaluation. Pre-trained CNN models from `tf.keras.applications` (such as MobileNetV2 or EfficientNetB0) are fine-tuned to achieve high accuracy on the custom dataset. The project was developed as part of a deep learning coursework assignment.

---

## 🧠 Classes

The model classifies mushrooms into the following 9 species:

- Agaricus  
- Amanita  
- Boletus  
- Cortinarius  
- Entoloma  
- Hygrocybe  
- Lactarius  
- Russula  
- Suillus  

---

## 📁 Project Structure

```

mushroom-classification-tensorflow/
│
├── proj2.py                 # Main training script
├── proj2\_test.py           # Model loading and evaluation script
├── mushroom\_model.h5       # Trained model weights
├── mushroom\_test.csv       # CSV file with test image labels
├── mushroom\_test/          # Folder containing test images
├── requirements.txt        # Environment dependencies
└── README.md               # Project documentation

````

---

## 🚀 Features

- ✅ Transfer learning using TensorFlow/Keras pretrained CNNs (MobileNetV2, EfficientNet)
- ✅ Image preprocessing using OpenCV
- ✅ Data augmentation with random flip, zoom, rotation
- ✅ Fine-tuning via unfreezing model layers
- ✅ Custom testing pipeline for label prediction and accuracy evaluation
- ✅ Save and reload model using `.h5` format

---

## ⚙️ Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/mushroom-classification-tensorflow.git
cd mushroom-classification-tensorflow
````

### 2. Create Virtual Environment & Install Dependencies

```bash
python -m venv venv
source venv/bin/activate      # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Prepare Dataset

* Extract `Mushroom.zip` into a folder named `Mushroom/`
* Structure: `Mushroom/<ClassName>/*.jpg`
* Each class folder must match one of the 9 species names.

### 4. Train the Model

```bash
python proj2.py
```

This will preprocess the training images, train the model, and save it as `mushroom_model.h5`.

### 5. Evaluate on Test Set

* Extract `mushroom_test.zip` and make sure `mushroom_test/` and `mushroom_test.csv` are in the root directory.
* Run the test script:

```bash
python proj2_test.py
```

This will load the model, preprocess test images, and display overall test accuracy.

---

## 🧪 Evaluation Metrics

* Accuracy on a custom test set with unseen mushroom images.
* Visual output of predictions (optional).
* Proper preprocessing of test input (resizing, normalization).

---

## 🧰 Tech Stack

* **Programming Language:** Python 3.8+
* **Libraries:**

  * TensorFlow 2.10+
  * Keras
  * OpenCV (cv2)
  * NumPy
  * Pandas
  * Matplotlib

---

## 📝 Requirements (requirements.txt)

```
python==3.8.20
pandas==2.0.3
tensorflow==2.13.0
tensorflow-intel==2.13.0
```
---

## 📌 Notes

* All models are trained from pre-trained CNNs and fine-tuned on the Mushroom dataset.
* Test data is real-world image data not seen during training.
* `proj2_test.py` includes all necessary preprocessing logic for inference.
* The project adheres to academic integrity and is intended for coursework submission.

---

## 📄 License

This project is for **educational purposes only**. 
---

**Author:** Lakshmi Chakradhar Vijayarao

```




# Mushroom Classification using Scikit-Learn with Cross Validation

This project uses machine learning algorithms from the `scikit-learn` library to classify mushrooms as **edible (e)** or **poisonous (p)** based on 20 categorical features. The primary goal is to determine the most accurate and generalized model using **cross-validation** and **grid search** techniques.

## 📌 Objective
- Use `DecisionTreeClassifier`, `RandomForestClassifier`, and a selected `KNeighborsClassifier` from scikit-learn.
- Employ preprocessing and grid search with cross-validation to identify optimal parameters.
- Evaluate the performance and generalization of each model using statistical accuracy metrics.
- Save and submit models for evaluation and competition.

---

## 🧪 Dataset
- **Input File**: `mushrooms_5000.csv`
- **Target Classes**:  
  - `e`: Edible  
  - `p`: Poisonous
- **Features**: 20 categorical attributes representing characteristics of mushrooms.

---

## 🛠️ Models Used
1. **DecisionTreeClassifier**
2. **RandomForestClassifier**
3. **KNeighborsClassifier** (nearest neighbor algorithm)

Each model was tuned using:
- **GridSearchCV**
- **5-fold Cross Validation**
- At least **2 hyperparameters with 2+ values** per model

---

## 📊 Evaluation Metrics
Each model was evaluated based on:
- **Cross-Validation Accuracy**
- **Mean and Standard Deviation of Errors**
- **Final Test Accuracy**

### 📈 Example Grid Search Results (Summary Table)
| Model                  | Best Params                     | Mean Accuracy | Std Dev |
|------------------------|----------------------------------|---------------|---------|
| DecisionTreeClassifier | {'max_depth': [10, None]}        | 0.935         | 0.012   |
| RandomForestClassifier | {'n_estimators': [100, 200]}     | 0.960         | 0.008   |
| KNeighborsClassifier   | {'n_neighbors': [3, 5, 7]}       | 0.910         | 0.014   |

---

## 🧠 Preprocessing Steps
- Encoded all categorical features using `LabelEncoder`
- Handled missing values by:
  - Dropping rows with missing data *(or)*  
  - Filling with mode depending on column behavior

---

## 💾 Output Files
- `decision_tree_model.pkl`  
- `random_forest_model.pkl`  
- `knn_model.pkl`  
- ✅ `proj1_chosen_model.pkl` (Best performing model)
- `proj1_evaluate.py`: Edited evaluation script with pre-processing and prediction code

---

## 💡 How to Run

### Environment Setup
Install dependencies using:

```bash
pip install -r requirements.txt
````

### Run Training & Model Saving

```bash
python proj1_training.py
```

### Run Evaluation

```bash
python proj1_evaluate.py
```

---

## 📦 Requirements

```txt
python==3.8.20
scikit-learn==1.3.2
pandas==2.0.3
numpy==1.24.4
```

---

## 📄 Project Structure

```
mushroom-classification/
├── proj1_training.py
├── proj1_evaluate.py
├── decision_tree_model.pkl
├── random_forest_model.pkl
├── knn_model.pkl
├── proj1_chosen_model.pkl
├── mushrooms_5000.csv
├── requirements.txt
└── README.md
```

---

## 🏁 Results

The `RandomForestClassifier` achieved the highest test accuracy, and is saved as the `proj1_chosen_model.pkl` for final evaluation.

---

## ✍️ Author

Lakshmi Chakradhar Vijayarao

---



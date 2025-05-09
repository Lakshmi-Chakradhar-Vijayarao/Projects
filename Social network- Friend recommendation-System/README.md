# 🤝 Friend Recommendation Engine using PySpark RDD

This project implements a scalable **mutual friend-based recommendation system** using **Apache Spark RDD transformations**. It analyzes a basic social network dataset and recommends top mutual friends for a set of test users.

---

## 🚀 Technologies Used

- **Apache Spark (PySpark)**
- **RDD Transformations**: `map`, `filter`, `reduce`
- **Python 3**
- **Databricks or Spark Cluster**
- **collections.Counter** for frequency-based friend suggestions

---

## 📁 Input Format

**File**: `friend_list.txt`  
**Each line format**:
```
UserID<TAB>Friend1,Friend2,Friend3,...
```

**Example**:
```
1	2,3,4,5
2	1,5,6
...
```

---

## 📌 Features

- Identifies **mutual friends** between users
- Generates **Top 10 recommended friends** for selected test user IDs
- Avoids suggesting already-connected friends
- Uses **intersection and frequency analysis** to rank recommendations
- Outputs recommendations in the format:
  ```
  UserID<TAB>RecommendedFriend1,RecommendedFriend2,...
  ```

---

## ⚙️ How It Works

1. Load and parse the dataset using `sc.textFile`
2. Split into `(UserID, [FriendList])` pairs using RDD `map`
3. For each test user:
   - Compare their friend list with others
   - Use `set.intersection` to find mutual friends
   - Rank others by mutual friend count
   - Use `collections.Counter` to rank top mutual connections
4. Output the top 10 most frequent mutual friends not already connected

---

## 📂 Project Structure

```
friend-recommender-engine-pyspark-rdd/
│
├── friend_recommendation_rdd.py       # Main Spark application logic
├── friend_list.txt                    # Input file with friend relationships
└── README.md                          # This file
```

---

## 🧪 Running the Project

1. Launch a PySpark environment (Databricks / local Spark / Jupyter with Spark context)
2. Upload or place `friend_list.txt` in accessible file storage (e.g., `dbfs:/FileStore/`)
3. Run the `friend_recommendation_rdd.py` script
4. View output friend suggestions for the test user IDs

---

## 🧾 Sample Output

```
1	45,87,34,78,12,93,120,29,56,18
17	98,54,61,35,104,202,111,48,67,76
...
```

---

## 📜 License

This project is open for academic, research, and non-commercial use only. Contributions are welcome.

---

## 🙋‍♂️ Author

Lakshmi Chakradhar Vijayarao  


# Social Network Analysis - Twitter  
**Assignment 3 - Question 2**  
**Course:** Big Data Analytics  
**Author:** Lakshmi Chakradhar Vijayarao  
**Dataset Source:** [Stanford University - SNAP](https://snap.stanford.edu/data/ego-Twitter.html)  
**Dataset:** ego-Twitter (Social Circles)  

---

## Overview
This project performs social network analysis on a Twitter ego-network dataset using Apache Spark and GraphFrames. The dataset represents a user's Twitter followers and followees. We apply graph processing techniques to extract insights about user connectivity and influence.

---

## Technologies and Libraries

- **Apache Spark 3.5**
- **GraphFrames 0.8.3**
- **PySpark**
- **Databricks Platform**
- **Maven Libraries:**
  - `com.databricks:spark-xml_2.12:0.15.0`
  - `com.microsoft.azure.kusto:spark-kusto-connector:2.0.0`
  - `graphframes:graphframes:0.8.3-spark3.5-s_2.12`

To install GraphFrames:
```python
%sh /databricks/python3/bin/pip install graphframes
````

---

## File Structure

```
.
├── twitter_c.csv                          # Input Twitter dataset
├── output/
│   ├── QueryA/                            # Top 5 nodes by out-degree
│   ├── QueryB/                            # Top 5 nodes by in-degree
│   ├── QueryC/                            # Top 5 nodes by PageRank
│   ├── QueryD/                            # Top 5 largest connected components
│   └── QueryE/                            # Top 5 nodes by triangle count
├── SocialNetworkAnalysis_Notebook.py      # Source code (Databricks notebook exported)
└── README.md                              # This file
```

---

## Tasks and Results

### ✅ A) Top 5 Nodes with Highest Out-Degree

* Measures users with the highest number of outgoing connections (who they follow).
* **Output:** `/FileStore/output/QueryResults/QueryA`

### ✅ B) Top 5 Nodes with Highest In-Degree

* Measures users with the highest number of incoming connections (followers).
* **Output:** `/FileStore/output/QueryResults/QueryB`

### ✅ C) PageRank Computation

* Calculates PageRank with `resetProbability=0.15` and `maxIter=10`.
* Identifies the most influential users.
* **Output:** `/FileStore/output/QueryResults/QueryC`

### ✅ D) Connected Components

* Runs connected components algorithm on a 10% edge-sampled subgraph.
* Extracts top 5 components by size.
* **Output:** `/FileStore/output/QueryResults/QueryD`

### ✅ E) Triangle Count

* Counts the number of closed triplets (triangles) per user.
* Highlights highly clustered users.
* **Output:** `/FileStore/output/QueryResults/QueryE`

---

## How to Run the Project

1. Upload `twitter_c.csv` to `dbfs:/FileStore/twitter/`.
2. Open Databricks and create a new notebook.
3. Install GraphFrames if not already available.
4. Paste the code provided into the notebook.
5. Run all cells.
6. Check `/FileStore/output/QueryResults/` for CSV output files.

---




# TF-IDF Based Movie Search

## Overview

This project implements a movie search engine that ranks movies based on Term Frequency - Inverse Document Frequency (TF-IDF). The engine processes movie plot summaries, removes stopwords, and allows users to search for movies using keywords. The movies are ranked based on their relevance to the given search terms. The project uses Apache Spark to compute the necessary values and supports both single and multi-keyword search queries.

## Features

* **TF-IDF Calculation**: Computes TF, IDF, and their product (TF-IDF) for each term in the movie plot summaries.
* **Stopwords Removal**: Removes common stopwords (e.g., "the", "and") to improve search accuracy.
* **Single and Multi-Keyword Search**: Supports searching with both single and multiple keywords.
* **Top 10 Results**: Returns the top 10 movies based on relevance to the search query.

## Setup Instructions

### Prerequisites

* **Apache Spark**: Distributed computing framework for processing large datasets.
* **Python**: Programming language used to implement the logic.
* **NLTK**: Used for text processing tasks like tokenization and stopword removal.

### Installation

1. Install required dependencies:

   ```bash
   pip install nltk
   ```

2. Install and configure Apache Spark:
   Follow the [Apache Spark installation guide](https://spark.apache.org/docs/latest/) to set up Spark on your local machine or cluster.

3. Download NLTK datasets for stopwords and punkt:

   ```python
   import nltk
   nltk.download('stopwords')
   nltk.download('punkt')
   ```

4. Prepare your dataset:

   * `plot_summaries.txt`: Contains the plot summaries of movies.
   * `movie_metadata.tsv`: Contains metadata, including movie IDs and names.
   * `testcases-3.txt`: File containing user queries (search terms).

### Running the Project

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/your-repository-name.git
   cd your-repository-name
   ```

2. Run the script to process movie plot summaries and calculate TF-IDF:

   ```bash
   python tfidf_movie_search.py
   ```

3. Search for movies based on keywords:

   * **Single Keyword Search**:

     ```python
     result = keywords_Search('keyword')
     ```

   * **Multiple Keyword Search**:

     ```python
     result = multiple_Keywords_Search('keyword1 keyword2 keyword3')
     ```

4. Process user queries from a file:

   ```python
   # Example query file (testcases-3.txt)
   # 'action'
   # 'drama comedy'
   ```

   The top 10 results will be printed based on relevance to the query terms.

## Example Output

For the query file `testcases-3.txt`:

```
action
drama comedy
```

The output would look like:

```
Top 10 Documents for 'action':
Movie ID: 123, Movie Name: Action Movie 1
Movie ID: 456, Movie Name: Action Movie 2
...

Top 10 Documents for 'drama comedy':
Movie ID: 789, Movie Name: Drama Comedy Movie 1
Movie ID: 101, Movie Name: Drama Comedy Movie 2
...
```

## Contributing

Feel free to fork the repository, make changes, and submit pull requests. If you encounter any issues or have suggestions, please open an issue on the GitHub repository.


Feel free to replace the placeholders like `yourusername/your-repository-name` with your actual GitHub username and repository name. This README should be good to go for your GitHub project!


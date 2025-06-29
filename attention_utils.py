import torch
from transformers import AutoModel, AutoTokenizer
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np
import string

def get_attention(model, tokenizer, text, layer=11, average_heads=True):
    inputs = tokenizer(text, return_tensors="pt")
    inputs = {k: v.to("cpu") for k, v in inputs.items()}
    with torch.no_grad():
        outputs = model(**inputs)

    attention = outputs.attentions[layer]  # Shape: [batch, heads, seq_len, seq_len]

    if average_heads:
        attn_matrix = attention.mean(dim=1).squeeze(0).numpy()
    else:
        attn_matrix = attention[0, 0].numpy()

    tokens = tokenizer.convert_ids_to_tokens(inputs["input_ids"].squeeze(0))
    return tokens, attn_matrix

def plot_attention_heatmap(tokens, attention_matrix, cmap="coolwarm"):
    token_count = len(tokens)
    fig_width = min(0.6 * token_count + 1, 10)
    fig_height = min(0.6 * token_count + 1, 10)

    fig, ax = plt.subplots(figsize=(fig_width, fig_height))
    sns.heatmap(
        attention_matrix,
        xticklabels=tokens,
        yticklabels=tokens,
        cmap=cmap,
        cbar=True,
        square=True,
        annot=False,
        fmt=".2f",
        center=0.5
    )
    plt.xticks(rotation=45, ha="right", fontsize=10)
    plt.yticks(rotation=0, fontsize=10)
    ax.set_title("Token-to-Token Self-Attention", fontsize=14, pad=12)
    plt.tight_layout()
    return fig

def get_top_attention_pairs(tokens, attention_matrix, top_n=5):
    ignore_tokens = {"[CLS]", "[SEP]", "[PAD]", "<|endoftext|>"}
    punctuation_set = set(string.punctuation)

    valid_pairs = []
    for i in range(len(tokens)):
        for j in range(len(tokens)):
            if (
                i == j
                or tokens[i] in ignore_tokens
                or tokens[j] in ignore_tokens
                or tokens[i] in punctuation_set
                or tokens[j] in punctuation_set
            ):
                continue
            valid_pairs.append((i, j))

    if not valid_pairs:
        return []

    sorted_pairs = sorted(valid_pairs, key=lambda idx: attention_matrix[idx], reverse=True)
    return [(f"{tokens[i]}_{i}", f"{tokens[j]}_{j}", attention_matrix[i, j]) for i, j in sorted_pairs[:top_n]]

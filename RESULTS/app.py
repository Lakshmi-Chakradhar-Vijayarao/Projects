import streamlit as st
from transformers import AutoModel, AutoTokenizer
from attention_utils import (
    get_attention,
    plot_attention_heatmap,
    get_top_attention_pairs
)
import io
import pandas as pd
import altair as alt

st.set_page_config(page_title="Transformer Attention Explorer", layout="wide")

st.title("🔍 Transformer Attention Explorer")
st.markdown("""
This tool lets you visualize self-attention patterns in **BERT** and **GPT-2**.
- Choose a model and color theme
- Pick attention layer and head options
- View and download attention heatmaps
- Export top attention scores
- Visualize token relationships as a graph
""")

@st.cache_resource(show_spinner="Loading model and tokenizer...")
def get_model_and_tokenizer(model_name):
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = AutoModel.from_pretrained(model_name, output_attentions=True)
    model.eval()
    return model, tokenizer

# Input text and model
input_text = st.text_input("📝 Enter a sentence:", "Barack Obama was born in Hawaii.")
model_choice = st.selectbox("📦 Choose a model", ["bert-base-uncased", "distilgpt2"])

# Palette selector
colormaps = ["coolwarm", "viridis", "YlGnBu", "magma", "cubehelix"]
color_choice = st.selectbox("🎨 Choose a heatmap color palette", colormaps)

if input_text.strip():
    model, tokenizer = get_model_and_tokenizer(model_choice)

    # Layer and head options (based on model config)
    st.sidebar.title("⚙️ Advanced Attention Controls")
    max_layer = model.config.num_hidden_layers - 1
    selected_layer = st.sidebar.slider("🧱 Attention Layer", 0, max_layer, max_layer)
    avg_heads = st.sidebar.checkbox("📊 Average All Heads", value=True)

    if st.button("🔍 Visualize Attention"):
        tokens, attention = get_attention(model, tokenizer, input_text, selected_layer, avg_heads)

        st.subheader(f"📊 Attention Heatmap (Layer {selected_layer}, {'Avg' if avg_heads else 'Head 0'})")
        fig = plot_attention_heatmap(tokens, attention, cmap=color_choice)
        st.pyplot(fig)

        # Token index table
        st.markdown("#### 🧩 Token List with Indices")
        token_df = pd.DataFrame({
            "Index": list(range(len(tokens))),
            "Token": tokens
        })
        st.dataframe(token_df, use_container_width=True)

        # Show top token-to-token dependencies
        top_pairs = get_top_attention_pairs(tokens, attention, top_n=5)
        if top_pairs:
            st.markdown("### 🧠 Top attention dependencies (excluding special tokens, punctuation & self-loops):")
            table_data = {"Source → Target": [], "Score": []}
            chart_data = []
            for src, tgt, score in top_pairs:
                label = f"{src} → {tgt}"
                table_data["Source → Target"].append(label)
                table_data["Score"].append(f"{score:.2f}")
                chart_data.append({"Source": src, "Target": tgt, "Score": score})

            st.table(pd.DataFrame(table_data))

            # Graph View
            st.markdown("### 📈 Graph View of Token Dependencies")
            graph_df = pd.DataFrame(chart_data)
            chart = alt.Chart(graph_df).mark_circle(size=200).encode(
                x="Source",
                y="Target",
                color=alt.Color("Score", scale=alt.Scale(scheme="reds")),
                tooltip=["Source", "Target", "Score"]
            ).properties(height=400)
            st.altair_chart(chart, use_container_width=True)

            # Download heatmap as PNG
            buf = io.BytesIO()
            fig.savefig(buf, format="png")
            st.download_button(
                label="📥 Download Heatmap as PNG",
                data=buf.getvalue(),
                file_name="attention_heatmap.png",
                mime="image/png"
            )

            # Download scores as CSV
            st.download_button(
                label="📄 Download Attention Pairs as CSV",
                data=pd.DataFrame(table_data).to_csv(index=False),
                file_name="top_attention_scores.csv",
                mime="text/csv"
            )
        else:
            st.warning("No valid token pairs found for attention scoring.")

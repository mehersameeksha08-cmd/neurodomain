import streamlit as st
import numpy as np
import pandas as pd
import joblib
import json

st.set_page_config(
    page_title="NeuroHome",
    page_icon="🧠",
    layout="wide"
)

# -----------------------------
# LOAD MODEL + CONFIG
# -----------------------------
@st.cache_resource
def load_model():
    return joblib.load("neurohome_eeg_model.pkl")

model = load_model()

with open("neurohome_config.json", "r") as f:
    config = json.load(f)

threshold = config.get("threshold", 0.35)

# -----------------------------
# SESSION STATE
# -----------------------------
for device in ["light", "fan", "tv", "door"]:
    if device not in st.session_state:
        st.session_state[device] = False

# -----------------------------
# SIDEBAR
# -----------------------------
st.sidebar.title("🧠 NeuroHome")

page = st.sidebar.radio(
    "Navigation",
    [
        "🏠 Dashboard",
        "🧠 Brain Signal Demo",
        "💡 Smart Home Control",
        "📊 Model Results"
    ]
)

# -----------------------------
# DASHBOARD
# -----------------------------
if page == "🏠 Dashboard":

    st.title("🧠 NeuroHome")
    st.subheader("P300 EEG Based Smart Home Control Prototype")

    st.write(
        "NeuroHome is a software prototype that uses EEG/P300 "
        "brain-response classification to simulate smart-home control."
    )

    c1, c2, c3, c4 = st.columns(4)

    c1.metric("EEG Runs", "19")
    c2.metric("Usable Epochs", "9600")
    c3.metric("Target Recall", "90%")
    c4.metric("Balanced Accuracy", "89.15%")

    st.divider()

    st.subheader("System Flow")

    st.info(
        "EEG Signal → Preprocessing → P300 Detection → "
        "ML Classification → Smart Home Command"
    )

    st.success("✅ NeuroHome ML model loaded successfully")

# -----------------------------
# BRAIN SIGNAL DEMO
# -----------------------------
elif page == "🧠 Brain Signal Demo":

    st.title("🧠 Brain Signal Prediction Demo")

    st.write(
        "This section demonstrates how NeuroHome converts "
        "P300 classification output into a smart-home command."
    )

    probability = st.slider(
        "Simulated P300 Target Probability",
        min_value=0.0,
        max_value=1.0,
        value=0.60,
        step=0.01
    )

    prediction = 1 if probability >= threshold else 0

    st.write(f"Decision Threshold: **{threshold:.2f}**")

    if prediction == 1:
        st.success(
            f"🧠 P300 Target Detected — Probability: "
            f"{probability * 100:.2f}%"
        )
        st.session_state["p300_ready"] = True
    else:
        st.warning(
            f"NonTarget Detected — Probability: "
            f"{probability * 100:.2f}%"
        )
        st.session_state["p300_ready"] = False

# -----------------------------
# SMART HOME CONTROL
# -----------------------------
elif page == "💡 Smart Home Control":

    st.title("🏠 NeuroHome Smart Home Control")

    ready = st.session_state.get("p300_ready", False)

    if ready:
        st.success("🧠 P300 Target detected. Device control enabled.")
    else:
        st.warning(
            "Run the Brain Signal Demo and detect a Target first."
        )

    c1, c2 = st.columns(2)

    with c1:
        st.subheader("💡 Light")

        if st.button("Light ON / OFF"):
            if ready:
                st.session_state.light = not st.session_state.light

        st.write(
            "🟢 ON" if st.session_state.light else "🔴 OFF"
        )

        st.subheader("🌀 Fan")

        if st.button("Fan ON / OFF"):
            if ready:
                st.session_state.fan = not st.session_state.fan

        st.write(
            "🟢 ON" if st.session_state.fan else "🔴 OFF"
        )

    with c2:
        st.subheader("📺 TV")

        if st.button("TV ON / OFF"):
            if ready:
                st.session_state.tv = not st.session_state.tv

        st.write(
            "🟢 ON" if st.session_state.tv else "🔴 OFF"
        )

        st.subheader("🚪 Door")

        if st.button("Open / Close Door"):
            if ready:
                st.session_state.door = not st.session_state.door

        st.write(
            "🟢 OPEN" if st.session_state.door else "🔒 CLOSED"
        )

# -----------------------------
# MODEL RESULTS
# -----------------------------
elif page == "📊 Model Results":

    st.title("📊 NeuroHome Model Performance")

    st.write("**Classifier:** Logistic Regression")
    st.write("**EEG Runs:** 19")
    st.write("**Usable Epochs:** 9600")
    st.write("**Target Epochs:** 800")
    st.write("**NonTarget Epochs:** 8800")

    st.divider()

    col1, col2, col3 = st.columns(3)

    col1.metric(
        "Group-wise Accuracy",
        "92.07%"
    )

    col2.metric(
        "Threshold-Tuned Balanced Accuracy",
        "89.15%"
    )

    col3.metric(
        "Target Recall",
        "90%"
    )

    st.write("### Threshold-Tuned Results")

    results = pd.DataFrame({
        "Class": ["NonTarget", "Target"],
        "Precision": [0.99, 0.42],
        "Recall": [0.89, 0.90],
        "F1 Score": [0.93, 0.57]
    })

    st.dataframe(
        results,
        use_container_width=True,
        hide_index=True
    )

    st.info(
        "This prototype simulates smart-home device control. "
        "It does not directly operate physical appliances."
    )
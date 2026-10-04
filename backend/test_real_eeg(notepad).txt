import os
import json
import numpy as np
import mne
import requests


# ============================================================
# PATHS
# ============================================================

EDF_PATH = r"C:\Users\Meher Sameeksha\NeuroHome\dataset\s01\rc01.edf"

CONFIG_PATH = "preprocessing_config.json"

API_URL = "http://127.0.0.1:8000/predict"


# ============================================================
# LOAD CONFIG
# ============================================================

with open(CONFIG_PATH, "r") as f:
    config = json.load(f)

print("\nConfiguration loaded.")
print("Expected input:", config["input_shape"])


# ============================================================
# LOAD EDF
# ============================================================

print("\nLoading EDF...")

raw = mne.io.read_raw_edf(
    EDF_PATH,
    preload=True,
    verbose=False
)

print("EDF loaded.")
print("Original sampling frequency:", raw.info["sfreq"])
print("Original channels:", len(raw.ch_names))


# ============================================================
# SELECT 64 EEG CHANNELS
# ============================================================

eeg_channels = [
    ch for ch in raw.ch_names
    if ch not in ["EXG1", "EXG2", "EXG3", "EXG4"]
]

raw.pick(eeg_channels)

print("EEG channels:", len(raw.ch_names))


# ============================================================
# AVERAGE REFERENCE
# ============================================================

print("\nApplying average reference...")

raw.set_eeg_reference(
    "average",
    projection=False,
    verbose=False
)


# ============================================================
# RESAMPLE
# ============================================================

print("Resampling to 256 Hz...")

raw.resample(
    256,
    verbose=False
)


# ============================================================
# BAND-PASS FILTER
# ============================================================

print("Applying 0.1–30 Hz band-pass filter...")

raw.filter(
    l_freq=0.1,
    h_freq=30.0,
    verbose=False
)


# ============================================================
# READ ANNOTATIONS
# ============================================================

print("\nReading annotations...")

print("Number of annotations:", len(raw.annotations))


# ============================================================
# FIND STIMULUS EVENTS
# ============================================================

events = []
labels = []

target_count = 0
non_target_count = 0

for annotation in raw.annotations:

    description = str(annotation["description"])

    # Ignore non-stimulus annotations
    if description.startswith("#"):
        continue

    # Skip obvious start/end markers
    if "start" in description.lower():
        continue

    if "end" in description.lower():
        continue

    # Convert annotation time to sample
    sample = raw.time_as_index(
        annotation["onset"],
        use_rounding=True
    )[0]

    # Target markers contain Tgt
    if "Tgt" in description:

        events.append([
            sample,
            0,
            2
        ])

        labels.append(1)

        target_count += 1

    else:

        events.append([
            sample,
            0,
            1
        ])

        labels.append(0)

        non_target_count += 1


events = np.array(
    events,
    dtype=int
)

labels = np.array(
    labels,
    dtype=int
)


# ============================================================
# INFORMATION
# ============================================================

print("\nEvent extraction complete.")

print("Events:", len(events))
print("Target:", target_count)
print("Non-target:", non_target_count)


# ============================================================
# CREATE EPOCHS
# ============================================================

print("\nCreating epochs...")

epochs = mne.Epochs(
    raw,
    events,
    event_id={
        "non_target": 1,
        "target": 2
    },
    tmin=-0.2,
    tmax=0.8,
    baseline=(-0.2, 0),
    preload=True,
    reject_by_annotation=False,
    verbose=False
)


# ============================================================
# GET DATA
# ============================================================

X = epochs.get_data(
    copy=True
).astype(
    np.float32
)

y = labels


# ============================================================
# CHECK SHAPE
# ============================================================

print("\nEpoch data shape:", X.shape)
print("Labels shape:", y.shape)

print("Target samples:", np.sum(y == 1))
print("Non-target samples:", np.sum(y == 0))


# ============================================================
# SELECT FIRST EPOCH
# ============================================================

eeg = X[0]

print("\nSelected first EEG epoch:")
print("Shape:", eeg.shape)
print("Label:", y[0])


# ============================================================
# SEND TO API
# ============================================================

print("\nSending EEG to NeuroHome API...")

payload = {
    "eeg": eeg.tolist()
}

response = requests.post(
    API_URL,
    json=payload,
    timeout=60
)


# ============================================================
# SHOW RESULT
# ============================================================

print("\nHTTP status:", response.status_code)

print("\nNeuroHome prediction:")

print(
    json.dumps(
        response.json(),
        indent=4
    )
)
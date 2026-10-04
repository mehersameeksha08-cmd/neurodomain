import numpy as np
import mne
import requests
import json


# ============================================================
# PATHS
# ============================================================

EDF_PATH = r"C:\Users\Meher Sameeksha\NeuroHome\dataset\s01\rc01.edf"

API_URL = "http://127.0.0.1:8000/predict"


# ============================================================
# LOAD EDF
# ============================================================

print("Loading EDF...")

raw = mne.io.read_raw_edf(
    EDF_PATH,
    preload=True,
    verbose=False
)

print("EDF loaded.")
print("Channels:", len(raw.ch_names))
print("Sampling frequency:", raw.info["sfreq"])


# ============================================================
# DISPLAY ANNOTATIONS
# ============================================================

print("\nAnnotations decoded by MNE:")
print("Number:", len(raw.annotations))

for i, annotation in enumerate(raw.annotations[:10]):

    print(
        i,
        annotation["onset"],
        annotation["duration"],
        annotation["description"]
    )


# ============================================================
# EXTRACT TARGET CHARACTER
# ============================================================

target_character = None

for annotation in raw.annotations:

    description = str(
        annotation["description"]
    )

    if description.startswith("#Tgt"):

        # Example:
        # #TgtM_RC01_SOA63
        target_character = description[4]

        break


if target_character is None:

    raise RuntimeError(
        "Target character was not found."
    )


print(
    "\nTarget character:",
    target_character
)


# ============================================================
# SELECT 64 EEG CHANNELS
# ============================================================

print("\nSelecting EEG channels...")

# Official dataset structure:
# 64 EEG + EARL + EARR + 4 EOG = 70 channels

eeg_channels = raw.ch_names[:64]

raw.pick(eeg_channels)

print(
    "Selected channels:",
    len(raw.ch_names)
)


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
# BANDPASS FILTER
# ============================================================

print("Applying 0.1–30 Hz band-pass...")

raw.filter(
    l_freq=0.1,
    h_freq=30.0,
    verbose=False
)


# ============================================================
# BUILD EVENTS
# ============================================================

print("\nBuilding target/non-target events...")

events = []
labels = []

for annotation in raw.annotations:

    description = str(
        annotation["description"]
    )

    # Ignore metadata annotations
    if description.startswith("#"):
        continue

    # Ignore empty descriptions
    if not description.strip():
        continue

    # Convert annotation time to sample
    sample = raw.time_as_index(
        annotation["onset"],
        use_rounding=True
    )[0]

    # A flash is TARGET when the flashed row/column
    # contains the target character.
    if target_character in description:

        event_code = 2
        label = 1

    else:

        event_code = 1
        label = 0

    events.append(
        [
            sample,
            0,
            event_code
        ]
    )

    labels.append(label)


events = np.array(
    events,
    dtype=int
)

labels = np.array(
    labels,
    dtype=int
)


# ============================================================
# EVENT COUNTS
# ============================================================

print("\nEvent statistics:")

print(
    "Total events:",
    len(events)
)

print(
    "Target:",
    np.sum(labels == 1)
)

print(
    "Non-target:",
    np.sum(labels == 0)
)


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


print("\nFinal epoch shape:")
print(X.shape)


# ============================================================
# CHECK EXPECTED SHAPE
# ============================================================

if X.shape[1:] != (64, 257):

    raise RuntimeError(
        f"Unexpected EEG shape: {X.shape}"
    )


print(
    "EEG shape is correct: 64 × 257"
)


# ============================================================
# SELECT FIRST REAL EEG EPOCH
# ============================================================

eeg = X[0]

true_label = labels[0]

print("\nSelected epoch:")
print("Shape:", eeg.shape)
print("True label:", true_label)


# ============================================================
# LOAD MODEL CONFIG
# ============================================================

with open(
    "preprocessing_config.json",
    "r"
) as f:

    config = json.load(f)


# ============================================================
# SEND EEG TO NEUROHOME API
# ============================================================

print("\nSending real EEG to NeuroHome API...")

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

print(
    "\nHTTP status:",
    response.status_code
)

print(
    "\nNeuroHome prediction:"
)

print(
    json.dumps(
        response.json(),
        indent=4
    )
)
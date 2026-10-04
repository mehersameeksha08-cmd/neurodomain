import re
import numpy as np
import mne
import requests
import json


EDF_PATH = r"C:\Users\Meher Sameeksha\NeuroHome\dataset\s01\rc01.edf"
EVENT_PATH = r"C:\Users\Meher Sameeksha\NeuroHome\dataset\s01\rc01.edf.event"

API_URL = "http://127.0.0.1:8000/predict"


# ============================================================
# READ PHYSIONET EVENT FILE
# ============================================================

print("Reading PhysioNet event file...")

with open(EVENT_PATH, "r", encoding="latin-1") as f:
    text = f.read()

print("Event file loaded.")
print("Characters:", len(text))


# ============================================================
# EXTRACT ANNOTATIONS
# ============================================================

pattern = re.compile(
    r"(\d+):(\d+\.\d+)\s+(\d+)\s+(\S+)"
)

matches = pattern.findall(text)

print("Annotations found:", len(matches))

annotations = []

for minute, seconds, sample, description in matches:

    time_seconds = (
        int(minute) * 60
        + float(seconds)
    )

    annotations.append({
        "time": time_seconds,
        "sample": int(sample),
        "description": description
    })


for a in annotations[:10]:
    print(a)


# ============================================================
# FIND TARGET CHARACTER
# ============================================================

target_annotation = None

for a in annotations:

    if a["description"].startswith("#Tgt"):

        target_annotation = a["description"]

        break


if target_annotation is None:

    raise RuntimeError(
        "Target annotation not found."
    )


print("\nTarget annotation:")
print(target_annotation)


# ============================================================
# EXTRACT TARGET CHARACTER
# ============================================================

match = re.search(
    r"#Tgt([A-Za-z0-9_])",
    target_annotation
)

if match:

    target_character = match.group(1)

else:

    raise RuntimeError(
        "Could not determine target character."
    )


print("Target character:", target_character)


# ============================================================
# LOAD EDF
# ============================================================

print("\nLoading EDF...")

raw = mne.io.read_raw_edf(
    EDF_PATH,
    preload=True,
    verbose=False
)

print("Original channels:", len(raw.ch_names))
print("Original sampling frequency:", raw.info["sfreq"])


# ============================================================
# SELECT FIRST 64 EEG CHANNELS
# ============================================================

# PhysioNet documentation says the recording contains
# 64 EEG electrodes plus EARL/EARR and 4 EOG channels.

eeg_channels = raw.ch_names[:64]

raw.pick(eeg_channels)

print("Selected EEG channels:", len(raw.ch_names))


# ============================================================
# REFERENCE
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
# BANDPASS
# ============================================================

print("Applying 0.1–30 Hz band-pass...")

raw.filter(
    0.1,
    30.0,
    verbose=False
)


# ============================================================
# BUILD STIMULUS EVENTS
# ============================================================

stimulus_annotations = []

for a in annotations:

    description = a["description"]

    # Ignore metadata
    if description.startswith("#"):
        continue

    stimulus_annotations.append(a)


print(
    "\nStimulus annotations:",
    len(stimulus_annotations)
)


# ============================================================
# CLASSIFY STIMULI
# ============================================================

events = []
labels = []

for a in stimulus_annotations:

    description = a["description"]

    # A row/column stimulus is target if it contains
    # the target character.

    if target_character in description:

        label = 1

    else:

        label = 0

    sample = raw.time_as_index(
        a["time"],
        use_rounding=True
    )[0]

    events.append([
        sample,
        0,
        label + 1
    ])

    labels.append(label)


events = np.array(
    events,
    dtype=int
)

labels = np.array(
    labels,
    dtype=int
)


print("\nEvents:", len(events))
print("Target:", np.sum(labels == 1))
print("Non-target:", np.sum(labels == 0))


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


X = epochs.get_data(
    copy=True
).astype(
    np.float32
)


print("\nFinal EEG shape:", X.shape)


# ============================================================
# SELECT FIRST EPOCH
# ============================================================

eeg = X[0]

print(
    "Selected EEG shape:",
    eeg.shape
)

print(
    "Selected label:",
    labels[0]
)


# ============================================================
# LOAD CONFIG
# ============================================================

with open(
    "preprocessing_config.json",
    "r"
) as f:

    config = json.load(f)


# ============================================================
# SEND TO NEUROHOME
# ============================================================

payload = {
    "eeg": eeg.tolist()
}

print("\nSending EEG to NeuroHome...")

response = requests.post(
    API_URL,
    json=payload,
    timeout=60
)


print("\nHTTP status:")
print(response.status_code)

print("\nPrediction:")

print(
    json.dumps(
        response.json(),
        indent=4
    )
)
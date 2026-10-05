from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
os.environ["CUDA_VISIBLE_DEVICES"] = "-1"
import tensorflow as tf
import numpy as np
import json
import os
import mne
import tempfile
try:
    tf.config.set_visible_devices([], "GPU")
except:
    pass


# ============================================================
# NEUROHOME API
# ============================================================

app = FastAPI(
    title="NeuroHome API",
    description="EEG-based ERP Brain-Computer Interface API",
    version="1.0.0"
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# FILE PATHS
# ============================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

MODEL_PATH = os.path.join(
    BASE_DIR,
    "neurohome_spatial_dropout_final.keras"
)

CONFIG_PATH = os.path.join(
    BASE_DIR,
    "preprocessing_config.json"
)


# ============================================================
# LOAD PREPROCESSING CONFIGURATION
# ============================================================

print("Loading preprocessing configuration...")

with open(CONFIG_PATH, "r") as file:
    config = json.load(file)

print("Configuration loaded successfully!")


# ============================================================
# LOAD TRAINED MODEL
# ============================================================

print("Loading NeuroHome CNN model...")

model = tf.keras.models.load_model(MODEL_PATH)

print("NeuroHome model loaded successfully!")

# ============================================================
# PROTOTYPE BCI COMMAND MAPPING
# ============================================================
#
# IMPORTANT:
# The current CNN is trained only for:
#     Target / Non-target
#
# Therefore this mapping is NOT part of the CNN.
# It is a prototype command layer based on the
# target character encoded in the PhysioNet ERP recording.
#
# Later this can be replaced by a real multi-command
# EEG classifier.
# ============================================================

COMMAND_MAP = {
    "A": "LIGHT",
    "B": "FAN",
    "C": "TV"
}


def get_bci_command(label, target_character):

    # Non-target means no intentional command
    if label != "Target":
        return "NONE"

    # Convert character to uppercase
    character = str(
        target_character
    ).upper()

    # Get mapped appliance
    return COMMAND_MAP.get(
        character,
        "UNKNOWN"
    )


# ============================================================
# EEG INPUT FORMAT
# ============================================================

class EEGInput(BaseModel):
    eeg: list


# ============================================================
# HOME
# ============================================================

@app.get("/")
def home():

    return {
        "message": "NeuroHome API is running!",
        "model": "SpatialDropout CNN",
        "status": "ready"
    }


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/health")
def health():

    return {
        "status": "healthy",
        "model_loaded": True
    }


# ============================================================
# MODEL INFORMATION
# ============================================================

@app.get("/model-info")
def model_info():

    return {
        "model": "NeuroHome SpatialDropout CNN",

        "input_shape": config["input_shape"],

        "sampling_frequency":
            config["sampling_frequency"],

        "bandpass":
            config["bandpass"],

        "classification_threshold":
            config["classification_threshold"],

        "classes": {
            "0": "Non-target",
            "1": "Target"
        }
    }


# ============================================================
# EEG PREDICTION
# ============================================================

@app.post("/predict")
def predict(data: EEGInput):

    # Convert incoming EEG data to NumPy
    eeg = np.array(
        data.eeg,
        dtype=np.float32
    )

    expected_shape = tuple(
        config["input_shape"]
    )


    # --------------------------------------------------------
    # Accept (64, 257)
    # --------------------------------------------------------

    if eeg.shape == (64, 257):

        eeg = np.expand_dims(
            eeg,
            axis=-1
        )


    # --------------------------------------------------------
    # Check shape
    # --------------------------------------------------------

    if eeg.shape != expected_shape:

        return {

            "error": "Invalid EEG shape",

            "received_shape":
                list(eeg.shape),

            "expected_shape":
                list(expected_shape)
        }


    # --------------------------------------------------------
    # NORMALIZATION
    # --------------------------------------------------------

    mean = config["training_mean"]

    std = config["training_std"]

    eeg = (
        eeg - mean
    ) / (
        std + 1e-8
    )


    # --------------------------------------------------------
    # ADD BATCH DIMENSION
    # --------------------------------------------------------

    eeg_batch = np.expand_dims(
        eeg,
        axis=0
    )


    # --------------------------------------------------------
    # MODEL PREDICTION
    # --------------------------------------------------------

    probability = float(
        model.predict(
            eeg_batch,
            verbose=0
        )[0][0]
    )


    # --------------------------------------------------------
    # CLASSIFICATION
    # --------------------------------------------------------

    threshold = config[
        "classification_threshold"
    ]


    if probability >= threshold:

        prediction = 1

        label = "Target"

        confidence = probability

    else:

        prediction = 0

        label = "Non-target"

        confidence = 1 - probability


    # --------------------------------------------------------
    # RESPONSE
    # --------------------------------------------------------

    return {

        "prediction": prediction,

        "label": label,

        "target_probability":
            round(
                probability,
                4
            ),

        "confidence":
            round(
                confidence,
                4
            )
    }
# ============================================================
# EDF FILE PROCESSING
# ============================================================

@app.post("/process-edf")
async def process_edf(file: UploadFile = File(...)):

    # --------------------------------------------------------
    # CHECK FILE TYPE
    # --------------------------------------------------------

    if not file.filename.lower().endswith(".edf"):

        return {
            "error": "Please upload an EDF file."
        }


    # --------------------------------------------------------
    # SAVE TEMPORARY EDF FILE
    # --------------------------------------------------------

    temp_path = None

    try:

        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=".edf"
        ) as temp_file:

            temp_path = temp_file.name

            contents = await file.read()

            temp_file.write(contents)


        print("\nLoading uploaded EDF...")

        raw = mne.io.read_raw_edf(
            temp_path,
            preload=True,
            verbose=False
        )

        print("EDF loaded.")

        # ----------------------------------------------------
        # TARGET CHARACTER
        # ----------------------------------------------------

        target_character = None

        for annotation in raw.annotations:

            description = str(
                annotation["description"]
            )

            if description.startswith("#Tgt"):

                target_character = description[4]

                break


        if target_character is None:

            return {
                "error": "Target character was not found in EDF."
            }


        # ----------------------------------------------------
        # SELECT 64 EEG CHANNELS
        # ----------------------------------------------------

        eeg_channels = raw.ch_names[:64]

        raw.pick(eeg_channels)


        # ----------------------------------------------------
        # AVERAGE REFERENCE
        # ----------------------------------------------------

        raw.set_eeg_reference(
            "average",
            projection=False,
            verbose=False
        )


        # ----------------------------------------------------
        # RESAMPLE
        # ----------------------------------------------------

        raw.resample(
            256,
            verbose=False
        )


        # ----------------------------------------------------
        # BANDPASS FILTER
        # ----------------------------------------------------

        raw.filter(
            l_freq=0.1,
            h_freq=30.0,
            verbose=False
        )


        # ----------------------------------------------------
        # BUILD EVENTS
        # ----------------------------------------------------

        events = []

        for annotation in raw.annotations:

            description = str(
                annotation["description"]
            )


            # Ignore metadata annotations

            if description.startswith("#"):
                continue


            if not description.strip():
                continue


            sample = raw.time_as_index(
                annotation["onset"],
                use_rounding=True
            )[0]


            if target_character in description:

                event_code = 2

            else:

                event_code = 1


            events.append(
                [
                    sample,
                    0,
                    event_code
                ]
            )


        events = np.array(
            events,
            dtype=int
        )


        # ----------------------------------------------------
        # CHECK EVENTS
        # ----------------------------------------------------

        if len(events) == 0:

            return {
                "error": "No EEG events were found."
            }


        # ----------------------------------------------------
        # CREATE EPOCHS
        # ----------------------------------------------------

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


        # ----------------------------------------------------
        # GET EEG DATA
        # ----------------------------------------------------

        X = epochs.get_data(
            copy=True
        ).astype(
            np.float32
        )


        # ----------------------------------------------------
        # CHECK EPOCH SHAPE
        # ----------------------------------------------------

        if X.shape[1:] != (64, 257):

            return {

                "error": "Unexpected EEG epoch shape.",

                "received_shape":
                    list(X.shape),

                "expected_shape":
                    [64, 257]
            }


        # ----------------------------------------------------
        # SELECT FIRST EPOCH
        # ----------------------------------------------------

        eeg = X[0]

        # ----------------------------------------------------
        # EEG WAVEFORM FOR FRONTEND VISUALIZATION
        # ----------------------------------------------------

        # Use the first EEG channel only for visualization.
        # The CNN still uses all 64 channels.
        waveform = eeg[0].tolist()


        # ----------------------------------------------------
        # PREDICT USING EXISTING MODEL
        # ----------------------------------------------------

        mean = config["training_mean"]

        std = config["training_std"]


        eeg_normalized = (
            eeg - mean
        ) / (
            std + 1e-8
        )


        eeg_input = np.expand_dims(
            eeg_normalized,
            axis=-1
        )


        eeg_batch = np.expand_dims(
            eeg_input,
            axis=0
        )


        probability = float(

            model.predict(
                eeg_batch,
                verbose=0
            )[0][0]

        )


        # ----------------------------------------------------
        # CLASSIFICATION
        # ----------------------------------------------------

        threshold = config[
            "classification_threshold"
        ]


        if probability >= threshold:

            prediction = 1

            label = "Target"

            confidence = probability

        else:

            prediction = 0

            label = "Non-target"

            confidence = 1 - probability

        # --------------------------------------------------------
        # BCI COMMAND
        # --------------------------------------------------------

        command = get_bci_command(
            label,
            target_character
        )

        # ----------------------------------------------------
        # RESPONSE
        # ----------------------------------------------------

        return {

            "filename": file.filename,

            "target_character":
                target_character,

            "epochs_processed":
                int(len(X)),

            "eeg_shape":
                [64, 257],

            "sampling_frequency":
                256,

            "bandpass":
                "0.1-30 Hz",

            "prediction":
                prediction,

            "label":
                label,

            "target_probability":
                round(
                    probability,
                    4
                ),

            "confidence":
                round(
                    confidence,
                    4
                ),
                
            "command": command,

            "waveform": waveform    
        }


    finally:

        # ----------------------------------------------------
        # REMOVE TEMPORARY FILE
        # ----------------------------------------------------

        if temp_path is not None:

            try:

                os.remove(temp_path)

            except Exception:

                pass
            
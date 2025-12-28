from flask import Flask, request, jsonify
from flask_cors import CORS
import tensorflow as tf
import numpy as np
from PIL import Image
import json
import os

# ======================
# INIT APP
# ======================
app = Flask(__name__)
CORS(app)  # supaya React boleh akses Flask

# ======================
# LOAD MODEL & LABEL
# ======================
model = tf.keras.models.load_model('waste_classification_model.h5')

with open('class_labels.json', 'r') as f:
    class_indices = json.load(f)

labels = list(class_indices.keys())

# ======================
# PREPROCESS IMAGE
# ======================
def preprocess_image(img):
    img = img.resize((224, 224))
    img_array = np.array(img) / 255.0
    img_array = np.expand_dims(img_array, axis=0)
    return img_array

# ======================
# ROUTES
# ======================
@app.route('/')
def home():
    return "Waste Classification API is running"

@app.route('/predict', methods=['POST'])
def predict():
    if 'image' not in request.files:
        return jsonify({'error': 'No image uploaded'}), 400

    file = request.files['image']
    img = Image.open(file).convert('RGB')

    img_array = preprocess_image(img)
    prediction = model.predict(img_array)

    predicted_class = labels[np.argmax(prediction)]
    confidence = float(np.max(prediction))

    return jsonify({
        'prediction': predicted_class,
        'confidence': confidence
    })

# ======================
# RUN SERVER
# ======================
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    host = '0.0.0.0'
    debug = os.environ.get('FLASK_DEBUG', 'False').lower() in ('1', 'true', 'yes')
    app.run(host=host, port=port, debug=debug)

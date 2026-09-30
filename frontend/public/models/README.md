# MNIST digit recognizer

Source: https://github.com/microsoft/onnxruntime-inference-examples/blob/main/c_cxx/MNIST/mnist.onnx

Microsoft ONNX Runtime inference examples; distributed under the included MIT license.

SHA-256: `2f06e72de813a8635c9bc0397ac447a601bdbfa7df4bebc278723b958831c9bf`

Input: float32 `[1, 1, 28, 28]`, white ink on black, values in `[0, 1]`.
Output: ten digit scores. The UI applies softmax, measures inference latency, and asks
the visitor to confirm before navigating. The model recognizes 0–9; only 1–6 map to routes.

The model (26 KB) and ONNX Runtime are loaded only when the visitor requests recognition.
Runtime WASM assets are copied locally by `scripts/copy-ort.mjs`. No CDN is needed at runtime.
This is a pretrained demonstration model, not a model trained by the portfolio owner.

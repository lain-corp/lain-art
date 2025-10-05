#!/bin/bash
set -e

dfx canister call lain_art_backend clear_face_detection_model_bytes --network ic
dfx canister call lain_art_backend clear_face_recognition_model_bytes --network ic
ic-file-uploader lain_art_backend append_face_detection_model_bytes version-RFB-320.onnx --network ic
ic-file-uploader lain_art_backend append_face_recognition_model_bytes face-recognition.onnx --network ic
dfx canister call lain_art_backend setup_models --network ic

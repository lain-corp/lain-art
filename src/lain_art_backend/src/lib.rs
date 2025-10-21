use candid::{CandidType, Deserialize};
use ic_stable_structures::{
    memory_manager::{MemoryId, MemoryManager},
    DefaultMemoryImpl,
};

use num_traits::ToPrimitive;

use std::collections::HashMap;
use ic_cdk::caller;
// --- Upload submission state (in-memory, not stable) ---
thread_local! {
    static SUBMISSIONS: RefCell<HashMap<u64, SubmissionData>> = RefCell::new(HashMap::new());
    static NEXT_SUBMISSION_ID: RefCell<u64> = RefCell::new(1);
    static APPROVED_ARTWORK: RefCell<Vec<ApprovedArtwork>> = RefCell::new(Vec::new());
}

#[allow(dead_code)]
struct SubmissionData {
    creator: candid::Principal,
    chunks: Vec<Vec<u8>>,
    mime: Option<String>,
    size: Option<u64>,
    sha256: Option<Vec<u8>>,
}

/// Approved artwork that has been verified to contain Lain
#[derive(CandidType, Deserialize, Clone)]
pub struct ApprovedArtwork {
    pub id: u64,
    pub creator: candid::Principal,
    pub image_data: Vec<u8>,
    pub mime_type: String,
    pub timestamp: u64,
    pub recognition_score: f32,
}
use onnx::{setup, BoundingBox, Embedding, Person};
use std::cell::RefCell;

mod onnx;
mod storage;
mod transactions;
// --- Fee flow ---
#[ic_cdk::query]
fn get_fee_invoice(submission_id: candid::Nat) -> transactions::FeeInvoice {
    transactions::get_fee_invoice(submission_id)
}

// WASI polyfill requires a virtual stable memory to store the file system.
// You can replace `0` with any index up to `254`.
const WASI_MEMORY_ID: MemoryId = MemoryId::new(0);

// Files in the WASI filesystem (in the stable memory) that store the models.
const FACE_DETECTION_FILE: &str = "face-detection.onnx";
const FACE_RECOGNITION_FILE: &str = "face-recognition.onnx";

thread_local! {
    // The memory manager is used for simulating multiple memories.
    static MEMORY_MANAGER: RefCell<MemoryManager<DefaultMemoryImpl>> =
        RefCell::new(MemoryManager::init(DefaultMemoryImpl::default()));
}

// --- Upload flow scaffolding ---

/// An error that is returned to the front-end.
#[derive(CandidType, Deserialize)]
struct Error {
    message: String,
}

/// The result of the face detection endpoint.
#[derive(CandidType, Deserialize)]
enum Detection {
    Ok(BoundingBox),
    Err(String),
}

/// The result of the face addition endpoint.
#[derive(CandidType, Deserialize)]
enum Addition {
    Ok(Embedding),
    Err(String),
}

/// The result of the face recognition endpoint.
#[derive(CandidType, Deserialize)]
enum Recognition {
    Ok(Person),
    Err(String),
}

/// Returns a bounding box around the detected face in the input image.
#[ic_cdk::query]
fn detect(image: Vec<u8>) -> Detection {
    let result = match onnx::detect(image) {
        Ok(result) => Detection::Ok(result.0),
        Err(err) => Detection::Err(err.to_string()),
    };
    result
}

/// Performs face recognition and returns the name of the person whose recorded
/// face is closest to the face in the given image. It also returns the distance
/// between the face embeddings.
#[ic_cdk::update]
fn recognize(image: Vec<u8>) -> Recognition {
    let result = match onnx::recognize(image) {
        Ok(result) => Recognition::Ok(result),
        Err(err) => Recognition::Err(err.to_string()),
    };
    result
}

/// Adds a person with the given name (label) and face (image) for future
/// face recognition requests.
#[ic_cdk::update]
fn add(label: String, image: Vec<u8>) -> Addition {
    let result = match onnx::add(label, image) {
        Ok(result) => Addition::Ok(result),
        Err(err) => Addition::Err(err.to_string()),
    };
    result
}

/// Clears the face detection model file.
/// This is used for incremental chunk uploading of large files.
#[ic_cdk::update]
fn clear_face_detection_model_bytes() {
    storage::clear_bytes(FACE_DETECTION_FILE);
}

/// Clears the face recognition model file.
/// This is used for incremental chunk uploading of large files.
#[ic_cdk::update]
fn clear_face_recognition_model_bytes() {
    storage::clear_bytes(FACE_RECOGNITION_FILE);
}

/// Appends the given chunk to the face detection model file.
/// This is used for incremental chunk uploading of large files.
#[ic_cdk::update]
fn append_face_detection_model_bytes(bytes: Vec<u8>) {
    ic_cdk::println!("[append_face_detection_model_bytes] Received {} bytes", bytes.len());
    ic_cdk::println!("[append_face_detection_model_bytes] First 100 bytes of chunk: {:?}", &bytes[..std::cmp::min(100, bytes.len())]);
    
    storage::append_face_detection_bytes(bytes);
    
    let stable_memory_size = storage::get_stable_memory_stats().0;
    ic_cdk::println!("[append_face_detection_model_bytes] Stable memory size after append: {} bytes", stable_memory_size);
    
    let stable_memory_content = storage::face_detection_bytes();
    ic_cdk::println!("[append_face_detection_model_bytes] First 100 bytes of stable memory: {:?}", &stable_memory_content[..std::cmp::min(100, stable_memory_content.len())]);
}

/// Appends the given chunk to the face recognition model file.
/// This is used for incremental chunk uploading of large files.
#[ic_cdk::update]
fn append_face_recognition_model_bytes(bytes: Vec<u8>) {
    ic_cdk::println!("[append_face_recognition_model_bytes] Received {} bytes", bytes.len());
    ic_cdk::println!("[append_face_recognition_model_bytes] First 100 bytes of chunk: {:?}", &bytes[..std::cmp::min(100, bytes.len())]);
    
    storage::append_face_recognition_bytes(bytes);
    
    let stable_memory_size = storage::get_stable_memory_stats().1;
    ic_cdk::println!("[append_face_recognition_model_bytes] Stable memory size after append: {} bytes", stable_memory_size);
    
    let stable_memory_content = storage::face_recognition_bytes();
    ic_cdk::println!("[append_face_recognition_model_bytes] First 100 bytes of stable memory: {:?}", &stable_memory_content[..std::cmp::min(100, stable_memory_content.len())]);
}

/// Once the model files have been incrementally uploaded,
/// this function loads them into in-memory models.
#[ic_cdk::update]
fn setup_models() -> Result<(), String> {
    let face_detection_bytes = storage::face_detection_bytes();
    let face_recognition_bytes = storage::face_recognition_bytes();
    
    ic_cdk::println!("[Debug] Setting up face detection model. Bytes size: {}", face_detection_bytes.len());
    ic_cdk::println!("[Debug] Setting up face recognition model. Bytes size: {}", face_recognition_bytes.len());
    
    setup(face_detection_bytes, face_recognition_bytes)
        .map_err(|err| format!("Failed to setup model: {}", err))
}

#[ic_cdk::init]
fn init() {
    let wasi_memory = MEMORY_MANAGER.with(|m| m.borrow().get(WASI_MEMORY_ID));
    ic_wasi_polyfill::init_with_memory(&[0u8; 32], &[], wasi_memory);
}

#[ic_cdk::post_upgrade]
fn post_upgrade() {
    let wasi_memory = MEMORY_MANAGER.with(|m| m.borrow().get(WASI_MEMORY_ID));
    ic_wasi_polyfill::init_with_memory(&[0u8; 32], &[], wasi_memory);
}

/// Starts a new submission and returns its unique ID as Candid Nat.
/// The caller becomes the creator of the submission.
#[ic_cdk::update]
fn start_submission() -> candid::Nat {
    let id = NEXT_SUBMISSION_ID.with(|next| {
        let mut n = next.borrow_mut();
        let id = *n;
        *n += 1;
        id
    });
    SUBMISSIONS.with(|subs| {
        subs.borrow_mut().insert(id, SubmissionData {
            creator: caller(),
            chunks: Vec::new(),
            mime: None,
            size: None,
            sha256: None,
        });
    });
    candid::Nat::from(id)
}

/// Appends a chunk of data to the submission with the given ID.
/// Chunks are stored in the order of their chunk_index.
#[ic_cdk::update]
fn put_chunk(submission_id: candid::Nat, chunk_index: candid::Nat, chunk: Vec<u8>) {
    let submission_id_u64: u64 = submission_id.0.to_u64().expect("submission_id too large");
    let chunk_index_u64: u64 = chunk_index.0.to_u64().expect("chunk_index too large");
    SUBMISSIONS.with(|subs| {
        let mut subs = subs.borrow_mut();
        if let Some(sub) = subs.get_mut(&submission_id_u64) {
            let idx = chunk_index_u64 as usize;
            if sub.chunks.len() <= idx {
                sub.chunks.resize(idx + 1, Vec::new());
            }
            sub.chunks[idx] = chunk;
        }
    });
}

/// Finalizes the asset for the given submission.
/// Records the MIME type, size, and SHA-256 hash of the uploaded file.
/// Typically, this is where the asset would be persisted and verified.
#[ic_cdk::update]
fn finalize_asset(submission_id: candid::Nat, mime: String, size: candid::Nat, sha256: Vec<u8>) {
    let submission_id_u64: u64 = submission_id.0.to_u64().expect("submission_id too large");
    let size_u64: u64 = size.0.to_u64().expect("size too large");
    SUBMISSIONS.with(|subs| {
        let mut subs = subs.borrow_mut();
        if let Some(sub) = subs.get_mut(&submission_id_u64) {
            sub.mime = Some(mime);
            sub.size = Some(size_u64);
            sub.sha256 = Some(sha256);
            // Here you would typically persist the asset, verify hash, etc.
        }
    });
}

/// Runs face detection on the uploaded image for the given submission ID.
/// Returns the bounding box of the detected face.
#[ic_cdk::update]
fn run_face_detection(submission_id: candid::Nat) -> Result<BoundingBox, String> {
    let submission_id_u64: u64 = submission_id.0.to_u64().expect("submission_id too large");

    SUBMISSIONS.with(|subs| {
        let subs = subs.borrow();
        if let Some(sub) = subs.get(&submission_id_u64) {
            if let Some(chunks) = sub.chunks.first() {
                let image_data: Vec<u8> = chunks.clone();
                match detect(image_data) {
                    Detection::Ok(bounding_box) => {
                        ic_cdk::println!("[Face Detection] Success: Bounding Box = {:?}", bounding_box);
                        Ok(bounding_box)
                    }
                    Detection::Err(err) => {
                        ic_cdk::println!("[Face Detection] Error: {}", err);
                        Err(format!("Face detection failed: {}", err))
                    }
                }
            } else {
                ic_cdk::println!("[Face Detection] Error: No image chunks found for submission ID {}", submission_id_u64);
                Err("No image chunks found".to_string())
            }
        } else {
            ic_cdk::println!("[Face Detection] Error: Submission ID {} not found", submission_id_u64);
            Err("Submission ID not found".to_string())
        }
    })
}

/// Verifies if Lain is present in the submitted artwork and stores it if verification passes.
/// This is the main function for the artwork submission flow.
#[ic_cdk::update]
fn verify_and_store_artwork(submission_id: candid::Nat) -> Result<u64, String> {
    let submission_id_u64: u64 = submission_id.0.to_u64().expect("submission_id too large");

    SUBMISSIONS.with(|subs| {
        let subs = subs.borrow();
        if let Some(sub) = subs.get(&submission_id_u64) {
            // Concatenate all chunks into a single image
            let image_data: Vec<u8> = sub.chunks.iter().flatten().copied().collect();
            
            if image_data.is_empty() {
                return Err("No image data found".to_string());
            }

            ic_cdk::println!("[Verify Artwork] Processing submission {} with {} bytes", submission_id_u64, image_data.len());

            // Step 1: Detect if there's a face
            match detect(image_data.clone()) {
                Detection::Ok(bounding_box) => {
                    ic_cdk::println!("[Verify Artwork] Face detected: {:?}", bounding_box);
                    
                    // Step 2: Recognize if the face belongs to Lain
                    match recognize(image_data.clone()) {
                        Recognition::Ok(person) => {
                            ic_cdk::println!("[Verify Artwork] Recognition result: {} with score {}", person.label, person.score);
                            
                            // Check if the recognized person is Lain
                            if person.label.to_lowercase() == "lain" {
                                // Verification successful! Store the artwork
                                let artwork_id = APPROVED_ARTWORK.with(|artwork| {
                                    let mut artwork = artwork.borrow_mut();
                                    let new_id = artwork.len() as u64;
                                    
                                    artwork.push(ApprovedArtwork {
                                        id: new_id,
                                        creator: sub.creator,
                                        image_data: image_data.clone(),
                                        mime_type: sub.mime.clone().unwrap_or_else(|| "image/jpeg".to_string()),
                                        timestamp: ic_cdk::api::time(),
                                        recognition_score: person.score,
                                    });
                                    
                                    ic_cdk::println!("[Verify Artwork] ✓ Artwork approved and stored with ID {}", new_id);
                                    new_id
                                });
                                
                                Ok(artwork_id)
                            } else {
                                Err(format!("Face recognition failed: Detected '{}' instead of 'Lain'", person.label))
                            }
                        }
                        Recognition::Err(err) => {
                            ic_cdk::println!("[Verify Artwork] Recognition error: {}", err);
                            Err(format!("Face recognition failed: {}", err))
                        }
                    }
                }
                Detection::Err(err) => {
                    ic_cdk::println!("[Verify Artwork] Detection error: {}", err);
                    Err(format!("Face detection failed: {}", err))
                }
            }
        } else {
            Err("Submission ID not found".to_string())
        }
    })
}

/// Returns all approved artwork.
#[ic_cdk::query]
fn get_approved_artwork() -> Vec<ApprovedArtwork> {
    APPROVED_ARTWORK.with(|artwork| artwork.borrow().clone())
}

/// Returns a specific approved artwork by ID.
#[ic_cdk::query]
fn get_artwork_by_id(artwork_id: u64) -> Option<ApprovedArtwork> {
    APPROVED_ARTWORK.with(|artwork| {
        artwork.borrow().get(artwork_id as usize).cloned()
    })
}

/// Returns the count of approved artwork.
#[ic_cdk::query]
fn get_artwork_count() -> u64 {
    APPROVED_ARTWORK.with(|artwork| artwork.borrow().len() as u64)
}

/// Returns all stored face labels in the database.
#[ic_cdk::query]
fn list_stored_faces() -> Vec<String> {
    storage::get_all_faces()
        .into_iter()
        .map(|(label, _)| label)
        .collect()
}

/// Returns the number of faces stored in the database.
#[ic_cdk::query]
fn get_face_count() -> candid::Nat {
    candid::Nat::from(storage::get_face_database_size())
}

/// Removes a face from the database by label.
#[ic_cdk::update]
fn remove_face(label: String) {
    storage::remove_face_from_database(&label);
}


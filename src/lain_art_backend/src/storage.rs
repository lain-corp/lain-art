use bytes::Bytes;
use ic_stable_structures::memory_manager::MemoryId;
use ic_stable_structures::memory_manager::MemoryManager;
use ic_stable_structures::{Memory, Ic0StableMemory};
use std::cell::RefCell;

// Separate memory IDs for each model to prevent overwrites
const FACE_DETECTION_MEMORY_ID: MemoryId = MemoryId::new(0);
const FACE_RECOGNITION_MEMORY_ID: MemoryId = MemoryId::new(1);

thread_local! {
    static MEMORY_MANAGER: RefCell<MemoryManager<Ic0StableMemory>> =
        RefCell::new(MemoryManager::init(Ic0StableMemory::default()));
    
    // Track actual data size per model
    static FACE_DETECTION_SIZE: RefCell<u64> = RefCell::new(0);
    static FACE_RECOGNITION_SIZE: RefCell<u64> = RefCell::new(0);
}

// Face Detection Model Storage
pub fn face_detection_bytes() -> Bytes {
    read_model(FACE_DETECTION_MEMORY_ID, &FACE_DETECTION_SIZE, "face_detection")
}

pub fn append_face_detection_bytes(bytes: Vec<u8>) {
    append_model(FACE_DETECTION_MEMORY_ID, &FACE_DETECTION_SIZE, bytes, "face_detection");
}

pub fn clear_face_detection_bytes() {
    clear_model(&FACE_DETECTION_SIZE, "face_detection");
}

// Face Recognition Model Storage
pub fn face_recognition_bytes() -> Bytes {
    read_model(FACE_RECOGNITION_MEMORY_ID, &FACE_RECOGNITION_SIZE, "face_recognition")
}

pub fn append_face_recognition_bytes(bytes: Vec<u8>) {
    append_model(FACE_RECOGNITION_MEMORY_ID, &FACE_RECOGNITION_SIZE, bytes, "face_recognition");
}

pub fn clear_face_recognition_bytes() {
    clear_model(&FACE_RECOGNITION_SIZE, "face_recognition");
}

// Helper Functions
fn read_model(
    memory_id: MemoryId,
    size_cell: &'static std::thread::LocalKey<RefCell<u64>>,
    label: &str
) -> Bytes {
    MEMORY_MANAGER.with(|manager| {
        let memory = manager.borrow().get(memory_id);
        let data_size = size_cell.with(|size| *size.borrow());
        
        #[cfg(debug_assertions)]
        ic_cdk::println!("[Debug] Reading {} model - Size: {} bytes", label, data_size);
        
        let mut buffer = vec![0; data_size as usize];
        if data_size > 0 {
            memory.read(0, &mut buffer);
        }
        
        #[cfg(debug_assertions)]
        ic_cdk::println!("[Debug] First 100 bytes of {}: {:?}", label, &buffer[..100.min(buffer.len())]);
        
        buffer
    }).into()
}

fn append_model(
    memory_id: MemoryId,
    size_cell: &'static std::thread::LocalKey<RefCell<u64>>,
    bytes: Vec<u8>,
    label: &str
) {
    #[cfg(debug_assertions)]
    ic_cdk::println!("[Debug] {}: Appending {} bytes", label, bytes.len());
    
    MEMORY_MANAGER.with(|manager| {
        let memory = manager.borrow().get(memory_id);
        let current_size = size_cell.with(|size| *size.borrow());
        
        let new_size = current_size + bytes.len() as u64;
        let required_pages = (new_size + 65535) / 65536;
        let current_pages = memory.size() / 65536;
        
        if required_pages > current_pages {
            let pages_to_grow = required_pages - current_pages;
            #[cfg(debug_assertions)]
            ic_cdk::println!("[Debug] {}: Growing by {} pages", label, pages_to_grow);
            
            if memory.grow(pages_to_grow) < 0 {
                ic_cdk::trap(&format!("Failed to grow stable memory for {}", label));
            }
        }
        
        memory.write(current_size, &bytes);
        size_cell.with(|size| *size.borrow_mut() = new_size);
        
        #[cfg(debug_assertions)]
        ic_cdk::println!("[Debug] {}: New total size: {} bytes", label, new_size);
    });
}

fn clear_model(size_cell: &'static std::thread::LocalKey<RefCell<u64>>, label: &str) {
    #[cfg(debug_assertions)]
    ic_cdk::println!("[Debug] Clearing {} model", label);
    
    size_cell.with(|size| *size.borrow_mut() = 0);
}

// Memory Statistics
pub fn get_stable_memory_stats() -> (u64, u64) {
    let detection_size = FACE_DETECTION_SIZE.with(|s| *s.borrow());
    let recognition_size = FACE_RECOGNITION_SIZE.with(|s| *s.borrow());
    (detection_size, recognition_size)
}

// Legacy compatibility for existing code
pub fn bytes(filename: &str) -> Bytes {
    match filename {
        "face-detection.onnx" => face_detection_bytes(),
        "face-recognition.onnx" => face_recognition_bytes(),
        _ => Bytes::new(),
    }
}

pub fn append_bytes(filename: &str, bytes: Vec<u8>) {
    match filename {
        "face-detection.onnx" => append_face_detection_bytes(bytes),
        "face-recognition.onnx" => append_face_recognition_bytes(bytes),
        _ => ic_cdk::trap("Invalid filename"),
    }
}

pub fn clear_bytes(filename: &str) {
    match filename {
        "face-detection.onnx" => clear_face_detection_bytes(),
        "face-recognition.onnx" => clear_face_recognition_bytes(),
        _ => {},
    }
}

pub fn get_stable_memory_size(_file: &str) -> usize {
    let (det, rec) = get_stable_memory_stats();
    (det + rec) as usize
}
use bytes::Bytes;
use ic_stable_structures::memory_manager::MemoryId;
use ic_stable_structures::memory_manager::MemoryManager;
use ic_stable_structures::{Memory, Ic0StableMemory};
use std::cell::RefCell;

const MEMORY_ID: MemoryId = MemoryId::new(0);

thread_local! {
    static MEMORY_MANAGER: RefCell<MemoryManager<Ic0StableMemory>> =
        RefCell::new(MemoryManager::init(Ic0StableMemory::default()));
    static DATA_SIZE: RefCell<u64> = RefCell::new(0);
}

pub fn bytes(_filename: &str) -> Bytes {
    MEMORY_MANAGER.with(|manager| {
        let memory = manager.borrow().get(MEMORY_ID);
        let data_size = DATA_SIZE.with(|size| *size.borrow());
        ic_cdk::println!("[Debug] Reading from stable memory - Data size: {} bytes", data_size);
        let mut buffer = vec![0; data_size as usize];
        if data_size > 0 {
            memory.read(0, &mut buffer);
        }
        ic_cdk::println!("[Debug] First 100 bytes of stable memory: {:?}", &buffer[..100.min(data_size as usize)]);
        buffer
    }).into()
}

pub fn append_bytes(_filename: &str, bytes: Vec<u8>) {
    ic_cdk::println!("[Debug] append_bytes: Appending {} bytes", bytes.len());
    ic_cdk::println!("[Debug] append_bytes: First 50 bytes of incoming data: {:?}", &bytes[..50.min(bytes.len())]);
    
    MEMORY_MANAGER.with(|manager| {
        let memory = manager.borrow().get(MEMORY_ID);
        let current_data_size = DATA_SIZE.with(|size| *size.borrow());
        ic_cdk::println!("[Debug] append_bytes: Current data size: {} bytes", current_data_size);
        
        let new_data_size = current_data_size + bytes.len() as u64;
        let required_pages = (new_data_size + 65535) / 65536;
        let current_pages = memory.size() / 65536;
        
        ic_cdk::println!("[Debug] append_bytes: New data size will be: {} bytes", new_data_size);
        ic_cdk::println!("[Debug] append_bytes: Required pages: {}, Current pages: {}", required_pages, current_pages);
        
        if required_pages > current_pages {
            let pages_to_grow = required_pages - current_pages;
            ic_cdk::println!("[Debug] append_bytes: Growing memory by {} pages", pages_to_grow);
            if memory.grow(pages_to_grow) < 0 {
                panic!("Failed to grow stable memory");
            }
        }
        
        ic_cdk::println!("[Debug] append_bytes: Writing {} bytes at offset {}", bytes.len(), current_data_size);
        memory.write(current_data_size, &bytes);
        
        DATA_SIZE.with(|size| {
            *size.borrow_mut() = new_data_size;
        });
        
        ic_cdk::println!("[Debug] append_bytes: Updated data size to: {} bytes", new_data_size);
    });
}

pub fn clear_bytes(_filename: &str) {
    ic_cdk::println!("[Debug] clear_bytes: Clearing all data");
    DATA_SIZE.with(|size| {
        *size.borrow_mut() = 0;
    });
    ic_cdk::println!("[Debug] clear_bytes: Data size reset to 0");
}

/// Returns the size in bytes of the stored file in stable memory.
pub fn get_stable_memory_size(file: &str) -> usize {
    bytes(file).len()
}
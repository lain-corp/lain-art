# `lain_art`

# lain-art
lain.art is a creative hub where fans upload original Lain-inspired artwork and photos. Each submission is verified for authenticity, rewarding creators with crypto and a unique NFT upon successful originality check. Share your vision, earn digital value, and join a decentralized art community.

# notes

To upload the models the procedure is the following :

use dfx 0.24.0 

```bash
dfxvm default 0.24.0
```

create an unencrypted version of your current dfx identity 

```bash
dfx identity export <your-id> > identity.pem
```

move the identity under the folder .config/dfx/identity/your-id in your home.

now you can use the cargo-uploader :

```bash
cargo install ic-file-uploader
```

and the script too

```bash
./upload_model_to_canister.sh 
```

How Face Recognition Works
The system uses a face database stored in memory rather than pre-stored baseline images. Here's the process:

1. Adding Reference Faces (Baseline Images)
You need to add reference faces using the add function in the canister:

```bash
dfx canister call lain_art_backend add '("PersonName", blob "binary_image_data")' --network ic
```

2. How It Works Internally
Face Database: The system maintains an in-memory database (DB) of known people as Vec<(String, Embedding)>
Adding Process: When you call add(label, image):
It computes a face embedding from the image
Stores the (label, embedding) pair in the database
Returns the computed embedding
3. Recognition Process
Input: When you call recognize(image):
Computes embedding for the input image
Compares it against all stored embeddings in the database
Finds the closest match (minimum distance)
Returns the person's label if distance < threshold (0.85)
4. Practical Usage
To set up your baseline faces, you would:

Prepare reference images of known people (JPEG, PNG, etc.)
Add each person using the add function:

```bash
# Add Person 1
dfx canister call lain_art_backend add '("Alice", blob "$(cat alice_photo.jpg | base64 -w 0)")' --network ic

# Add Person 2  
dfx canister call lain_art_backend add '("Bob", blob "$(cat bob_photo.jpg | base64 -w 0)")' --network ic
```

Test recognition:

```bash
dfx canister call lain_art_backend recognize '(blob "$(cat test_image.jpg | base64 -w 0)")' --network ic
```

TO DO

Expected flow of the application : A user submits the picture of their art, it is checked if Lain is present in the picture via verifying her face is clearly visible and belongs to her, and if the result is positive, the picture is stored in memory, and it will be displayed in the frontend canister.

# List all face labels stored in the database
dfx canister call lain_art_backend list_stored_faces --network ic

# Get the total count of faces
dfx canister call lain_art_backend get_face_count --network ic

# Upload Lain's face
npx tsx upload_face.ts laindb/03.png Lain03

# Test Recognition
npx tsx test_recognition.ts laindb/03.png

# Remove Face
npx tsx remove_face.ts TestFace
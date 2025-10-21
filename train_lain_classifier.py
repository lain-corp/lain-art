import os
import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import datasets, transforms, models
from torch.utils.data import DataLoader, random_split
from tqdm import tqdm

# Paths
DATA_DIR = "./laindb"  # Should contain 'lains/' and 'nonlains/' subfolders
MODEL_OUT = "lain_mobilenetv3.onnx"

# Hyperparameters
BATCH_SIZE = 16  # Smaller batch for better generalization
NUM_EPOCHS = 100  # More epochs with early stopping
LR = 1e-4  # Lower learning rate for fine-tuning
IMG_SIZE = 224
PATIENCE = 15  # Early stopping patience

# Data augmentation and normalization
train_transforms = transforms.Compose([
    transforms.RandomResizedCrop(IMG_SIZE, scale=(0.8, 1.0)),
    transforms.RandomHorizontalFlip(),
    transforms.RandomRotation(15),
    transforms.ColorJitter(brightness=0.3, contrast=0.3, saturation=0.3, hue=0.1),
    transforms.RandomAffine(degrees=0, translate=(0.1, 0.1)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

val_transforms = transforms.Compose([
    transforms.Resize((IMG_SIZE, IMG_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

# Dataset and loader
full_dataset = datasets.ImageFolder(DATA_DIR, transform=train_transforms)
val_dataset = datasets.ImageFolder(DATA_DIR, transform=val_transforms)

# Split into train/val (80/20)
dataset_size = len(full_dataset)
train_size = int(0.8 * dataset_size)
val_size = dataset_size - train_size

train_dataset, _ = random_split(full_dataset, [train_size, val_size])
_, val_dataset_split = random_split(val_dataset, [train_size, val_size])

train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True)
val_loader = DataLoader(val_dataset_split, batch_size=BATCH_SIZE, shuffle=False)

# Model setup
model = models.mobilenet_v3_small(pretrained=True)
model.classifier[3] = nn.Linear(model.classifier[3].in_features, 2)  # Binary head

# Unfreeze last few layers for fine-tuning
for param in model.features[:-3].parameters():
    param.requires_grad = False
for param in model.features[-3:].parameters():
    param.requires_grad = True

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = model.to(device)

# Loss and optimizer
criterion = nn.CrossEntropyLoss()
optimizer = optim.AdamW(filter(lambda p: p.requires_grad, model.parameters()), lr=LR, weight_decay=1e-4)
scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode='min', factor=0.5, patience=5, verbose=True)

# Early stopping
best_val_loss = float('inf')
patience_counter = 0

# Training loop
for epoch in range(NUM_EPOCHS):
    # Training phase
    model.train()
    running_loss = 0.0
    correct = 0
    total = 0
    for inputs, labels in tqdm(train_loader, desc=f"Epoch {epoch+1}/{NUM_EPOCHS} [Train]"):
        inputs, labels = inputs.to(device), labels.to(device)
        optimizer.zero_grad()
        outputs = model(inputs)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()
        running_loss += loss.item() * inputs.size(0)
        _, predicted = torch.max(outputs, 1)
        correct += (predicted == labels).sum().item()
        total += labels.size(0)
    
    train_loss = running_loss / len(train_dataset)
    train_acc = correct / total
    
    # Validation phase
    model.eval()
    val_loss = 0.0
    val_correct = 0
    val_total = 0
    with torch.no_grad():
        for inputs, labels in val_loader:
            inputs, labels = inputs.to(device), labels.to(device)
            outputs = model(inputs)
            loss = criterion(outputs, labels)
            val_loss += loss.item() * inputs.size(0)
            _, predicted = torch.max(outputs, 1)
            val_correct += (predicted == labels).sum().item()
            val_total += labels.size(0)
    
    val_loss = val_loss / len(val_dataset_split)
    val_acc = val_correct / val_total
    
    print(f"Train Loss: {train_loss:.4f} | Train Acc: {train_acc:.4f} | Val Loss: {val_loss:.4f} | Val Acc: {val_acc:.4f}")
    
    # Learning rate scheduling
    scheduler.step(val_loss)
    
    # Early stopping
    if val_loss < best_val_loss:
        best_val_loss = val_loss
        patience_counter = 0
        torch.save(model.state_dict(), "lain_mobilenetv3_best.pth")
        print(f"✓ Saved best model (val_loss: {val_loss:.4f})")
    else:
        patience_counter += 1
        if patience_counter >= PATIENCE:
            print(f"Early stopping triggered after {epoch+1} epochs")
            break

# Load best model
model.load_state_dict(torch.load("lain_mobilenetv3_best.pth"))

# Save PyTorch model
torch.save(model.state_dict(), "lain_mobilenetv3.pth")

# Export to ONNX
dummy_input = torch.randn(1, 3, IMG_SIZE, IMG_SIZE).to(device)
torch.onnx.export(model, dummy_input, MODEL_OUT, input_names=['input'], output_names=['output'], opset_version=12)

print(f"Training complete. Model saved as lain_mobilenetv3.pth and exported to {MODEL_OUT}")
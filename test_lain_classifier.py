import torch
from torchvision import transforms, models
from PIL import Image
import os

MODEL_PATH = "lain_mobilenetv3_best.pth"
IMG_SIZE = 224
class_names = ["lain", "non-lain"]  # Must match ImageFolder order: lains=0, nonlains=1

# Load model
model = models.mobilenet_v3_small(pretrained=False)
model.classifier[3] = torch.nn.Linear(model.classifier[3].in_features, 2)
model.load_state_dict(torch.load(MODEL_PATH, map_location="cpu"))
model.eval()

preprocess = transforms.Compose([
    transforms.Resize((IMG_SIZE, IMG_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

def predict(img_path):
    img = Image.open(img_path).convert("RGB")
    input_tensor = preprocess(img).unsqueeze(0)
    with torch.no_grad():
        output = model(input_tensor)
        _, pred = torch.max(output, 1)
        return pred.item()

def test_folder(folder, true_label):
    correct = 0
    total = 0
    for fname in os.listdir(folder):
        if not fname.lower().endswith(('.png', '.jpg', '.jpeg')):
            continue
        path = os.path.join(folder, fname)
        try:
            pred = predict(path)
            result = "✓" if pred == true_label else "✗"
            print(f"{path}: predicted={class_names[pred]}, actual={class_names[true_label]} {result}")
            correct += (pred == true_label)
            total += 1
        except Exception as e:
            print(f"{path}: error ({e})")
    return correct, total

if __name__ == "__main__":
    lains_folder = "laindb/lains"
    nonlains_folder = "laindb/nonlains"
    print("Testing lains...")
    lains_correct, lains_total = test_folder(lains_folder, 0)  # lains=0 per ImageFolder
    print("\nTesting nonlains...")
    nonlains_correct, nonlains_total = test_folder(nonlains_folder, 1)  # nonlains=1 per ImageFolder
    print("\nSummary:")
    print(f"Lains: {lains_correct}/{lains_total} correct")
    print(f"Nonlains: {nonlains_correct}/{nonlains_total} correct")
    total = lains_total + nonlains_total
    correct = lains_correct + nonlains_correct
    print(f"Overall accuracy: {correct}/{total} ({(correct/total*100 if total else 0):.2f}%)")
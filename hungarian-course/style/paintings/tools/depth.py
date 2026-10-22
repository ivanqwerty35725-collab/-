"""Depth Anything V2 (Base) on CPU. usage: depth.py in.png out_prefix [long_side]
Writes out_prefix.npy (float32, same HxW as input, larger = nearer, normalized 0..1) and out_prefix_vis.jpg"""
import sys, numpy as np, torch, cv2
from PIL import Image
from transformers import AutoImageProcessor, AutoModelForDepthEstimation

inp, out = sys.argv[1], sys.argv[2]
long_side = int(sys.argv[3]) if len(sys.argv) > 3 else 1036
M = "depth-anything/Depth-Anything-V2-Base-hf"
proc = AutoImageProcessor.from_pretrained(M)
model = AutoModelForDepthEstimation.from_pretrained(M).eval()
torch.set_num_threads(4)
im = Image.open(inp).convert("RGB")
W, H = im.size
s = long_side / max(W, H)
w14 = int(round(W * s / 14)) * 14
h14 = int(round(H * s / 14)) * 14


def run(img):
    x = np.asarray(img.resize((w14, h14), Image.BICUBIC)).astype(np.float32) / 255.0
    x = (x - np.array([0.485, 0.456, 0.406])) / np.array([0.229, 0.224, 0.225])
    t = torch.from_numpy(x.transpose(2, 0, 1)).float()[None]
    with torch.no_grad():
        d = model(pixel_values=t).predicted_depth[0].numpy()
    return d

d = run(im)
# test-time augmentation: horizontal flip
d2 = run(im.transpose(Image.FLIP_LEFT_RIGHT))[:, ::-1]
d = (d + d2) / 2
d = cv2.resize(d, (W, H), interpolation=cv2.INTER_CUBIC)
lo, hi = np.percentile(d, 0.5), np.percentile(d, 99.5)
d = np.clip((d - lo) / (hi - lo), 0, 1).astype(np.float32)
np.save(out + ".npy", d)
vis = cv2.applyColorMap((d * 255).astype(np.uint8), cv2.COLORMAP_INFERNO)
sc = 900 / max(W, H)
cv2.imwrite(out + "_vis.jpg", cv2.resize(vis, (int(W * sc), int(H * sc)), interpolation=cv2.INTER_AREA))
print("depth", W, H, "net", w14, h14)

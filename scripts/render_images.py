#!/usr/bin/env python3
"""Render a hero image for every post that has an `image_prompt` but no image file yet.

Uses MOSS-Image (SFT) on the local ComfyUI server. Needs Pillow and PyYAML, both of which
ComfyUI's own venv already has, so run it with that interpreter:

    ~/ComfyUI/.venv/bin/python scripts/render_images.py            # all missing images
    ~/ComfyUI/.venv/bin/python scripts/render_images.py --only SLUG   # just this post, if missing
    ~/ComfyUI/.venv/bin/python scripts/render_images.py --force SLUG  # re-render one post
"""
import argparse
import io
import json
import random
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import uuid
from pathlib import Path

import yaml
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
POSTS = ROOT / "src" / "content" / "posts"
IMAGES = ROOT / "src" / "assets" / "posts"
HOST = "http://127.0.0.1:8188"
CLIENT_ID = uuid.uuid4().hex
WIDTH, HEIGHT = 1216, 832  # ~1MP, 3:2-ish, multiples of 16
NEGATIVE = (
    "text, words, letters, watermark, logo, caption, label, jpeg artifacts, blurry, "
    "worst quality, deformed, cartoon, illustration, 3d render, people, faces, hands"
)


def post(path, payload):
    req = urllib.request.Request(HOST + path, json.dumps(payload).encode(),
                                 {"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"ComfyUI rejected graph: {e.read().decode()[:2000]}") from e


def get(path):
    with urllib.request.urlopen(HOST + path, timeout=60) as r:
        return r.read()


def moss_graph(prompt, seed, steps=30):
    return {
        "unet": {"class_type": "UNETLoader", "inputs": {
            "unet_name": "moss_image_sft_int8_convrot.safetensors", "weight_dtype": "default"}},
        "clip": {"class_type": "CLIPLoader", "inputs": {
            "clip_name": "qwen3.5_9b_int8_convrot.safetensors", "type": "moss_image",
            "device": "default"}},
        "vae": {"class_type": "VAELoader", "inputs": {"vae_name": "flux2-vae.safetensors"}},
        "slg": {"class_type": "SkipLayerGuidanceDiTSimple", "inputs": {
            "model": ["unet", 0], "double_layers": "", "single_layers": "22",
            "start_percent": 0.0, "end_percent": 0.5}},
        "pos": {"class_type": "CLIPTextEncode", "inputs": {"text": prompt, "clip": ["clip", 0]}},
        "neg": {"class_type": "CLIPTextEncode", "inputs": {"text": NEGATIVE, "clip": ["clip", 0]}},
        "latent": {"class_type": "EmptyFlux2LatentImage", "inputs": {
            "width": WIDTH, "height": HEIGHT, "batch_size": 1}},
        "ks": {"class_type": "KSampler", "inputs": {
            "model": ["slg", 0], "positive": ["pos", 0], "negative": ["neg", 0],
            "latent_image": ["latent", 0], "seed": seed, "steps": steps, "cfg": 3.0,
            "sampler_name": "euler", "scheduler": "sgm_uniform", "denoise": 1.0}},
        "decode": {"class_type": "VAEDecode", "inputs": {"samples": ["ks", 0], "vae": ["vae", 0]}},
        "save": {"class_type": "SaveImage", "inputs": {
            "images": ["decode", 0], "filename_prefix": "soulless-food/post"}},
    }


def run(graph, timeout=900):
    prompt_id = post("/prompt", {"prompt": graph, "client_id": CLIENT_ID})["prompt_id"]
    deadline = time.time() + timeout
    while time.time() < deadline:
        history = json.loads(get(f"/history/{prompt_id}"))
        if prompt_id in history:
            entry = history[prompt_id]
            if entry["status"].get("status_str") == "error":
                raise RuntimeError(json.dumps(entry["status"]["messages"])[:3000])
            for output in entry["outputs"].values():
                for img in output.get("images", []):
                    return get("/view?" + urllib.parse.urlencode(img))
            raise RuntimeError("ComfyUI returned no image")
        time.sleep(1)
    raise TimeoutError(f"ComfyUI job {prompt_id} did not finish in {timeout}s")


def front_matter(path):
    text = path.read_text()
    if not text.startswith("---"):
        return {}
    return yaml.safe_load(text.split("---", 2)[1]) or {}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--force", nargs="*", default=None,
                    help="re-render these post slugs (or all, if none given) even if images exist")
    ap.add_argument("--only", nargs="+", default=None,
                    help="only consider these post slugs (renders them if missing)")
    ap.add_argument("--steps", type=int, default=30)
    args = ap.parse_args()

    try:
        get("/system_stats")
    except Exception:
        sys.exit(f"ComfyUI is not reachable at {HOST}. Start it with ~/ComfyUI/start.sh")

    todo = []
    for path in sorted(POSTS.glob("*.md")):
        fm = front_matter(path)
        if not fm.get("image_prompt"):
            print(f"skip (no image_prompt): {path.name}")
            continue
        slug = re.sub(r"^\d{4}-\d{2}-\d{2}-", "", path.stem)
        out = IMAGES / f"{slug}.jpg"
        if args.only is not None and slug not in args.only:
            continue
        forced = args.force is not None and (not args.force or slug in args.force)
        if out.exists() and not forced:
            continue
        todo.append((path, fm, out))

    print(f"{len(todo)} image(s) to render")
    for i, (path, fm, out) in enumerate(todo, 1):
        t0 = time.time()
        seed = random.randrange(2**48)
        png = run(moss_graph(fm["image_prompt"], seed, args.steps))
        out.parent.mkdir(parents=True, exist_ok=True)
        Image.open(io.BytesIO(png)).convert("RGB").save(out, "JPEG", quality=84,
                                                        optimize=True, progressive=True)
        print(f"[{i}/{len(todo)}] {out.relative_to(ROOT)}  seed={seed}  {time.time() - t0:.0f}s",
              flush=True)


if __name__ == "__main__":
    main()

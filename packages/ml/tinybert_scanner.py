"""
TinyBERT URL Phishing Detection Module
Uses songhieng/TinyBERT-URL-Detection-1.0 for fast, accurate URL classification.
Model is loaded ONCE at startup and kept in memory for instant inference.
"""

import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import os
import time

# Global model + tokenizer (loaded once, reused for all requests)
_tokenizer = None
_model = None
_model_ready = False

MODEL_NAME = "songhieng/TinyBERT-URL-Detection-1.0"


def load_model():
    """Load TinyBERT model and tokenizer into memory. Called once at startup."""
    global _tokenizer, _model, _model_ready

    if _model_ready:
        return

    print(f"⏳ Loading TinyBERT model: {MODEL_NAME}...")
    start = time.time()

    try:
        # Use cache dir so Render doesn't re-download every deploy
        cache_dir = os.getenv("TRANSFORMERS_CACHE", "/tmp/hf_cache")

        _tokenizer = AutoTokenizer.from_pretrained(
            MODEL_NAME,
            cache_dir=cache_dir
        )
        _model = AutoModelForSequenceClassification.from_pretrained(
            MODEL_NAME,
            cache_dir=cache_dir
        )

        # Set to eval mode (no dropout, no gradient tracking)
        _model.eval()

        elapsed = round(time.time() - start, 2)
        print(f"✅ TinyBERT loaded in {elapsed}s  ({sum(p.numel() for p in _model.parameters()) / 1e6:.1f}M params)")
        _model_ready = True

    except Exception as e:
        print(f"❌ Failed to load TinyBERT: {e}")
        _model_ready = False


def predict_url(url: str) -> dict:
    """
    Classify a single URL using TinyBERT.
    Returns: {
        'decision': 'PHISHING' | 'LEGITIMATE',
        'confidence': float (0-100),
        'phishing_prob': float (0-1),
        'legitimate_prob': float (0-1),
        'model': 'TinyBERT-URL-Detection-1.0',
        'inference_ms': float
    }
    """
    if not _model_ready:
        # Fallback if model failed to load
        return {
            'decision': 'UNKNOWN',
            'confidence': 0,
            'phishing_prob': 0,
            'legitimate_prob': 0,
            'model': 'none',
            'inference_ms': 0,
            'error': 'Model not loaded'
        }

    start = time.time()

    # Tokenize
    inputs = _tokenizer(
        url,
        return_tensors="pt",
        truncation=True,
        padding=True,
        max_length=128
    )

    # Inference (no gradient computation = faster)
    with torch.no_grad():
        outputs = _model(**inputs)
        probs = torch.softmax(outputs.logits, dim=1)

    phishing_prob = probs[0][1].item()
    legitimate_prob = probs[0][0].item()

    # label 1 = phishing, label 0 = legitimate
    if phishing_prob > legitimate_prob:
        decision = 'PHISHING'
        confidence = round(phishing_prob * 100, 2)
    else:
        decision = 'LEGITIMATE'
        confidence = round(legitimate_prob * 100, 2)

    inference_ms = round((time.time() - start) * 1000, 2)

    return {
        'decision': decision,
        'confidence': confidence,
        'phishing_prob': round(phishing_prob, 4),
        'legitimate_prob': round(legitimate_prob, 4),
        'model': 'TinyBERT-URL-Detection-1.0',
        'inference_ms': inference_ms
    }


def predict_urls(urls: list) -> list:
    """Batch prediction for multiple URLs."""
    if not _model_ready:
        return [predict_url(u) for u in urls]

    start = time.time()

    inputs = _tokenizer(
        urls,
        return_tensors="pt",
        truncation=True,
        padding=True,
        max_length=128
    )

    with torch.no_grad():
        outputs = _model(**inputs)
        probs = torch.softmax(outputs.logits, dim=1)

    results = []
    for i, url in enumerate(urls):
        phishing_prob = probs[i][1].item()
        legitimate_prob = probs[i][0].item()

        if phishing_prob > legitimate_prob:
            decision = 'PHISHING'
            confidence = round(phishing_prob * 100, 2)
        else:
            decision = 'LEGITIMATE'
            confidence = round(legitimate_prob * 100, 2)

        results.append({
            'decision': decision,
            'confidence': confidence,
            'phishing_prob': round(phishing_prob, 4),
            'legitimate_prob': round(legitimate_prob, 4),
            'model': 'TinyBERT-URL-Detection-1.0',
        })

    total_ms = round((time.time() - start) * 1000, 2)
    for r in results:
        r['inference_ms'] = round(total_ms / len(results), 2)

    return results

---
title: "NVIDIA GPU Setup for AI Workloads"
order: 12
description: "GTX 1050 Ti capabilities, NVIDIA driver installation, CUDA toolkit, Ollama for local LLMs, Python GPU environment with PyTorch, and VRAM management for 2GB cards."
---
## Understanding Your GPU for Server Work

Your **GTX 1050 Ti** has:
- 2GB GDDR5 VRAM
- 768 CUDA cores
- CUDA Compute Capability: 6.1
- Max supported CUDA version: ~12.x

For your use case (data cleaning, Arabic translation of OpenFoodFacts):
- ✅ Small translation models (Helsinki-NLP opus-mt: ~300MB)
- ✅ Sentence embeddings (sentence-transformers: ~200MB)
- ✅ Quantized models Q4 via Ollama (fits in 2GB)
- ⚠️ Mistral 7B Q4: ~4GB — needs CPU fallback
- ❌ Llama 13B+: too large for VRAM

## Install NVIDIA Drivers

```bash
# See what's available
ubuntu-drivers devices

# Install recommended driver automatically
sudo ubuntu-drivers autoinstall

# Or install specific version (535 is stable as of 2026)
sudo apt install -y nvidia-driver-535

# REBOOT REQUIRED
sudo reboot
```

After reboot:
```bash
nvidia-smi
```

You should see your GPU info. This command is your health check for the GPU.

```
+-----------------------------------------------------------------------------+
| NVIDIA-SMI 535.x       Driver Version: 535.x     CUDA Version: 12.2        |
|-------------------------------+--------------------+------------------------+
| GPU  Name        Persistence-M| Bus-Id       Disp.A | Volatile Uncorr. ECC |
| Fan  Temp  Perf  Pwr:Usage/Cap|       Memory-Usage  | GPU-Util  Compute M. |
|   0  NVIDIA GTX 1050 Ti   Off |  00000000:01:00.0 Off|                  N/A |
| 30%   35C    P8    N/A /  75W |   0MiB / 2048MiB    |      0%      Default |
+-----------------------------------------------------------------------------+
```

## Install CUDA Toolkit

```bash
sudo apt install -y nvidia-cuda-toolkit

# Verify
nvcc --version
# nvcc: NVIDIA (R) Cuda compiler driver

# Add CUDA to PATH
echo 'export PATH=/usr/local/cuda/bin:$PATH' >> ~/.bashrc
echo 'export LD_LIBRARY_PATH=/usr/local/cuda/lib64:$LD_LIBRARY_PATH' >> ~/.bashrc
source ~/.bashrc
```

## Install Ollama for Local LLMs

```bash
curl -fsSL https://ollama.com/install.sh | sh

# Verify it uses GPU
ollama run mistral "test"
# In another terminal: nvidia-smi (should show GPU memory being used)

# Models for Arabic translation:
ollama pull aya          # Multilingual model with Arabic support
ollama pull mistral      # General purpose, handles Arabic with prompting

# List downloaded models
ollama list

# Remove a model (free up space)
ollama rm mistral
```

Ollama runs as a service on port 11434:
```bash
sudo systemctl status ollama
curl http://localhost:11434/api/tags   # list models via API
```

## Python GPU Environment

```bash
sudo apt install -y python3 python3-pip python3-venv

# Create isolated environment for AI work
python3 -m venv ~/aienv
source ~/aienv/bin/activate

# Install PyTorch with CUDA support (for CUDA 11.8 compatible with GTX 1050 Ti)
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118

# Verify GPU is available
python3 -c "
import torch
print(f'PyTorch version: {torch.__version__}')
print(f'CUDA available: {torch.cuda.is_available()}')
print(f'GPU: {torch.cuda.get_device_name(0)}')
print(f'VRAM: {torch.cuda.get_device_properties(0).total_memory / 1024**3:.1f} GB')
"

# Install NLP and data tools
pip install \
  pandas numpy \
  transformers \
  sentence-transformers \
  datasets \
  pyarrow fastparquet \
  tqdm \
  requests
```

## Managing VRAM with 2GB

2GB VRAM requires careful management:

```python
import torch

# Always clear GPU cache between tasks
torch.cuda.empty_cache()

# Check current VRAM usage
print(f"Allocated: {torch.cuda.memory_allocated(0) / 1024**2:.0f} MB")
print(f"Cached: {torch.cuda.memory_reserved(0) / 1024**2:.0f} MB")

# Use half precision to save VRAM (model uses 2x less memory)
model = model.half()  # float16 instead of float32

# Process in small batches
BATCH_SIZE = 8   # adjust down if you get CUDA out of memory errors

# Context manager to automatically free memory
with torch.no_grad():   # don't track gradients (saves memory)
    outputs = model(inputs)
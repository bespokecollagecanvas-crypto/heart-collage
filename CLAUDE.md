# CLAUDE.md - Heart Collage Project Guide

## Project Overview

**Heart Collage** is a Python GUI application that creates artistic photo collages arranged in a heart shape. Users can load images, select central and prominent photos, and generate visually appealing heart-shaped arrangements with drop shadows and color-based sorting.

### Key Features
- Load multiple images from a folder
- Select a central image (displayed larger in the middle)
- Designate up to 5 prominent images (displayed 1.5x larger)
- Automatic heart-shaped arrangement using parametric cardioid equations
- Color-based sorting by hue for gradient effects
- Drop shadow effects with Gaussian blur
- Random rotation for natural appearance
- Interactive drag-and-drop repositioning
- Export to PNG or JPEG

## Directory Structure

```
heart-collage/
├── .github/
│   ├── workflows/
│   │   └── build.yml           # GitHub Actions CI/CD pipeline
│   ├── heart_collage.py        # Main application source code
│   └── heart_mask.png          # Pre-generated heart mask reference (1000x1000)
└── CLAUDE.md                   # This file
```

**Note:** The main source code is located in `.github/heart_collage.py` (unconventional location).

## Technology Stack

| Technology | Purpose | Version |
|------------|---------|---------|
| Python | Core language | 3.11 |
| Tkinter | GUI framework | Standard library |
| Pillow (PIL) | Image processing | Latest |
| NumPy | Numerical operations | Latest |
| PyInstaller | Executable packaging | Latest |

## Development Setup

### Prerequisites
- Python 3.11+
- pip package manager

### Installation

```bash
# Install dependencies
pip install pillow numpy

# Run the application
python .github/heart_collage.py
```

### Building Executable

```bash
# Install PyInstaller
pip install pyinstaller

# Build standalone Windows EXE
pyinstaller --onefile --windowed .github/heart_collage.py
# Output: dist/heart_collage.exe
```

## Build System

### GitHub Actions CI/CD

The project uses GitHub Actions (`.github/workflows/build.yml`) to automatically build a Windows executable:

- **Trigger:** Push to `main` branch
- **Environment:** `windows-latest`
- **Python Version:** 3.11
- **Output:** Windows executable artifact named "HeartCollage"

### Build Steps
1. Checkout repository
2. Set up Python 3.11
3. Install dependencies: `pyinstaller pillow numpy`
4. Build with PyInstaller (`--onefile --windowed`)
5. Upload `dist/heart_collage.exe` as artifact

## Code Architecture

### Module Structure

The application consists of:
1. **Utility Functions** (module level):
   - `rgb_to_hsv()` - Color space conversion for hue-based sorting
   - `add_shadow()` - Drop shadow effect with Gaussian blur
   - `generate_heart_mask()` - Parametric heart shape generation
   - `point_in_mask()` - Collision detection helper

2. **Main Class** (`HeartCollageApp`):
   - Manages GUI setup and event handling
   - Handles image loading, processing, and collage generation
   - Implements drag-and-drop functionality

### Key Algorithms

**Heart Shape Generation** (cardioid curve):
```python
x = 16 * sin(t)^3
y = 13*cos(t) - 5*cos(2*t) - 2*cos(3*t) - cos(4*t)
```

**Image Placement:** Random positioning with collision detection (AABB), max 5000 attempts per image.

**Color Sorting:** Images sorted by average hue value (0-360) for gradient effect.

## Code Conventions

### Style Guidelines
- **Compact formatting:** Dense code with minimal whitespace
- **Variable naming:** Short/abbreviated names in math functions (`r`, `g`, `b`, `mx`, `mn`, `px`, `py`)
- **Class naming:** PascalCase (`HeartCollageApp`)
- **Function naming:** snake_case (`rgb_to_hsv`, `add_shadow`)
- **No type hints** in current codebase
- **Semicolons** used for multiple statements on single lines

### Important Constants
- Default canvas size: 900x650 pixels
- Default image size: 80 pixels
- Prominent image scale: 1.5x base size
- Central image scale: 2x base size
- Max placement attempts: 5000
- Max prominent images: 5
- Heart mask scale: 15

## Common Tasks

### Adding New Features
1. Utility functions go at module level before `HeartCollageApp` class
2. UI elements added in `setup_ui()` method
3. New buttons follow existing pattern: `tk.Button(frame, text="...", command=self.method)`

### Modifying Image Processing
- Shadow effects: Modify `add_shadow()` function
- Heart shape: Modify `generate_heart_mask()` - adjust `scale` parameter
- Color sorting: Modify `rgb_to_hsv()` or sorting logic in `generate_collage()`

### Changing Default Values
- Image size: `self.img_size=80` in `__init__`
- Canvas size: `width, height = 900, 650` in `generate_collage()`
- Window size: `self.master.geometry("950x750")` in `__init__`

## Known Limitations

1. No error handling for corrupted/invalid image files
2. Limited to 5 prominent images (hardcoded)
3. No undo/redo functionality
4. No keyboard shortcuts
5. Random placement may fail on densely packed collages
6. No tests or test framework
7. No requirements.txt (dependencies only in build.yml)

## File Naming Note

There is an oddly-named duplicate file `.github/python heart_collage.py.py` which appears to be an upload error. The canonical source is `.github/heart_collage.py`.

## Git Workflow

- Main branch: `main`
- CI triggers on push to `main`
- Build artifacts available via GitHub Actions

## Dependencies (No Version Pinning)

Current dependencies are installed without version constraints. For reproducible builds, consider creating a `requirements.txt`:

```
pillow>=10.0.0
numpy>=1.24.0
pyinstaller>=6.0.0
```

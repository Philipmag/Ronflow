#!/bin/bash
# Create minimal placeholder PNG icons for development testing

echo "Creating placeholder PNG icons..."

# Create a 1x1 purple pixel and scale it (requires ImageMagick)
if command -v convert &> /dev/null; then
    echo "ImageMagick found, generating PNGs from SVG..."
    convert -background none icons/icon16.svg icons/icon16.png
    convert -background none icons/icon48.svg icons/icon48.png
    convert -background none icons/icon128.svg icons/icon128.png
    echo "✅ PNG icons generated successfully!"
else
    echo "⚠️ ImageMagick not found. Creating minimal placeholder PNGs..."
    
    # Create base64 encoded minimal PNG files (purple squares)
    # These are valid but tiny PNGs that browsers will accept
    
    # 16x16 purple PNG
    echo "iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAOklEQVR4nGNgGAUjHdBkDqo7RzXgqIacQd05qgFHNYSROQMAAQYA7B8EQ/T+6REAAAAASUVORK5CYII=" | base64 -d > icons/icon16.png
    
    # 48x48 purple PNG  
    echo "iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAAOklEQVR4nGNgGAUjHdBkDqo7RzXgqIacQd05qgFHNYSROQMAAQYA7B8EQ/T+6REAAAAASUVORK5CYII=" | base64 -d > icons/icon48.png
    
    # 128x128 purple PNG
    echo "iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAAOklEQVR4nGNgGAUjHdBkDqo7RzXgqIacQd05qgFHNYSROQMAAQYA7B8EQ/T+6REAAAAASUVORK5CYII=" | base64 -d > icons/icon128.png
    
    echo "⚠️ Placeholder PNGs created. For production, replace with proper icons."
fi

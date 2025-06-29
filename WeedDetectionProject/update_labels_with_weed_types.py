import os
import random

# Paths to your label folders
labels_root = 'dataset/labels'
subfolders = ['train', 'val']  # Update both train and val

# New mapping:
# 0 -> crop (keep same)
# 1 -> broadleaf_weed
# 2 -> grass_weed
# 3 -> sedge_weed

# Function to modify labels
def update_labels(folder_path):
    for filename in os.listdir(folder_path):
        if filename.endswith('.txt'):
            file_path = os.path.join(folder_path, filename)
            with open(file_path, 'r') as f:
                lines = f.readlines()

            updated_lines = []
            for line in lines:
                parts = line.strip().split()
                class_id = int(parts[0])

                # If it's a weed (1), randomly reassign to 1, 2, or 3
                if class_id == 1:
                    new_class_id = random.choice([1, 2, 3])
                    parts[0] = str(new_class_id)

                updated_lines.append(' '.join(parts) + '\n')

            # Overwrite with updated labels
            with open(file_path, 'w') as f:
                f.writelines(updated_lines)

# Apply to both train and val
for subfolder in subfolders:
    folder_path = os.path.join(labels_root, subfolder)
    update_labels(folder_path)

print("✅ Successfully updated labels with multi-class weed types!")

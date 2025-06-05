import os
import shutil
import random

# Paths
data_dir = 'dataset/agri_data/data'
images_dir = os.path.join(data_dir)
labels_dir = os.path.join(data_dir)

output_images_dir = 'dataset/images'
output_labels_dir = 'dataset/labels'

# Create output directories
for split in ['train', 'val']:
    os.makedirs(os.path.join(output_images_dir, split), exist_ok=True)
    os.makedirs(os.path.join(output_labels_dir, split), exist_ok=True)

# Get all image files
image_files = [f for f in os.listdir(images_dir) if f.endswith('.jpeg')]
random.shuffle(image_files)

# Split ratio
split_ratio = 0.8
split_index = int(len(image_files) * split_ratio)

train_files = image_files[:split_index]
val_files = image_files[split_index:]

# Function to copy files
def copy_files(files, split):
    for file in files:
        img_src = os.path.join(images_dir, file)
        lbl_src = os.path.join(labels_dir, file.replace('.jpeg', '.txt'))
        
        img_dst = os.path.join(output_images_dir, split, file)
        lbl_dst = os.path.join(output_labels_dir, split, file.replace('.jpeg', '.txt'))
        
        shutil.copyfile(img_src, img_dst)
        shutil.copyfile(lbl_src, lbl_dst)

# Copy train and val files
copy_files(train_files, 'train')
copy_files(val_files, 'val')

print(f"Train images: {len(train_files)}")
print(f"Validation images: {len(val_files)}")
print("Dataset splitting complete!")

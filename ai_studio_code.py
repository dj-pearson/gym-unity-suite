import PIL.Image

# Load the user's uploaded image
img_path = "gym_photo.jpg" 
img = PIL.Image.open(img_path)

# Save as WebP
output_path = "Rep_Club_Gym.webp"
img.save(output_path, "WEBP", quality=95)
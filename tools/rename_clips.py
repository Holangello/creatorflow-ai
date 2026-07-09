import os

folder = input("Folder path: ")

files = os.listdir(folder)

for index, file in enumerate(files, start=1):
    ext = os.path.splitext(file)[1]
    os.rename(
        os.path.join(folder, file),
        os.path.join(folder, f"clip_{index:04d}{ext}")
    )

print("Done!")

const bucket = require('../config/firebaseConfig');
const compressImage = require('../config/imageProcessor');

exports.uploadImage = async (file, type, userId) => {
  console.log(type);
  let coverImageUrl =
    'https://www.shutterstock.com/image-vector/default-avatar-profile-icon-social-600nw-1677509740.jpg';

  if (file) {
    const compressedImage = await compressImage(file.buffer, 'coverImage');
    const fileName = `${type}/${userId}.webp`;
    const fileUpload = bucket.file(fileName);

    await fileUpload.save(compressedImage, {
      metadata: { contentType: 'image/webp' },
    });

    await fileUpload.makePublic();

    coverImageUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}?t=${Date.now()}}`;
  }
  return coverImageUrl;
};

exports.deleteImage = async (type, userId) => {
  const oldFile = bucket.file(`${type}/${userId}.webp`)
  await oldFile.delete()
};

import fs from 'fs';
import path from 'path';

const privateKey = 'private_0el0Dc/LfblBjbCZ2EnEhGdc72E=';
const filePath = 'public/banner-mayoristas-wide.jpg';
const fileBuffer = fs.readFileSync(filePath);
const base64File = fileBuffer.toString('base64');

async function upload() {
  const form = new FormData();
  form.append('file', base64File);
  form.append('fileName', 'banner-mayoristas-wide.jpg');
  form.append('folder', '/treegold/marca');
  form.append('useUniqueFileName', 'false');

  const authHeader = 'Basic ' + Buffer.from(privateKey + ':').toString('base64');

  const res = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
    method: 'POST',
    headers: {
      Authorization: authHeader,
    },
    body: form,
  });

  const json = await res.json();
  console.log('ImageKit upload result:', json.url);
}

upload().catch(console.error);

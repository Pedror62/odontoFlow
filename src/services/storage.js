// Para produção, usar Cloudinary, AWS S3 ou Firebase Storage
import axios from 'axios';

export const uploadImagem = async (file, pacienteId) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'odontologico');
  formData.append('folder', `pacientes/${pacienteId}`);
  
  const response = await axios.post(
    'https://api.cloudinary.com/v1_1/seu-cloud-name/image/upload',
    formData
  );
  
  return {
    url: response.data.secure_url,
    public_id: response.data.public_id
  };
};

export const deletarImagem = async (publicId) => {
  await axios.delete(`/api/imagens/${publicId}`);
};
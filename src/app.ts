import express from 'express';
import cors from 'cors'; // Importa el paquete cors
import { singer } from './AES/index'
import { sendFileToIPFS } from './IPFS'
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config();


const app = express();
const port = process.env.PORT || 8080

// Configura CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'DELETE', 'UPDATE', 'PUT', 'PATCH']
}));


const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Rutas y controladores de tu aplicación
app.get('/', async (req, res) => {
  res.send('result');
});

app.post('/upload', upload.single('pdfFile'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No se proporcionó ningún archivo PDF.');
  }

  console.log(req.body);
  const pdfBuffer = req.file.buffer;
  const pdfBlob = new Blob([req.file.buffer], { type: "application/pdf" });

  //const file = new File([pdfBlob], req.file.filename);

  const result = await singer(pdfBuffer);
  const responseIpfs = await sendFileToIPFS(pdfBlob);


  let metadata = {
    version: "zora-20210604",
    name: req.body.nombre,
    description: req.body.descripcion,
    mimeType: "application/pdf",
    animation_url: `ipfs://${responseIpfs.IpfsHash}`,
    external_url: `ipfs://${responseIpfs.IpfsHash}`,
    image: `ipfs://${responseIpfs.IpfsHash}`,
    attributes: [
      {
        trait_type: "cetificado AES",
        value: JSON.stringify(result, (_, v) => typeof v === 'bigint' ? v.toString() : v)
      }
    ]
  }

  const url_metadata = `data:application/json;base64,${JSON.stringify(metadata)}`



  const response = {
    aes: result,
    ipfs: responseIpfs,
    metadata: metadata,
    base64string: url_metadata

  }

  const r = JSON.stringify(response, (_, v) => typeof v === 'bigint' ? v.toString() : v)
  res.status(200).json(JSON.parse(r));


});

app.listen(port, () => {
  console.log(`Server is listening at http://localhost:${port}`);
});


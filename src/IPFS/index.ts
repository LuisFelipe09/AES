import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

export const sendFileToIPFS = async (pdf: Blob) => {


    try {

        const formData = new FormData();
        formData.append("file", pdf, 'docuemtno.pdf');

        const resFile = await axios({
            method: "post",
            url: "https://api.pinata.cloud/pinning/pinFileToIPFS",
            data: formData,
            headers: {
                'pinata_api_key': `${process.env.PINATA_API_KEY}`,
                'pinata_secret_api_key': `${process.env.PINATA_API_SECRET}`,
                "Content-Type": "multipart/form-data"
            },
        });

        const ImgHash = `ipfs://${resFile.data.IpfsHash}`;
        console.log(ImgHash);
        //Take a look at your Pinata Pinned section, you will see a new file added to you list.   
        return resFile.data;


    } catch (error) {
        console.log("Error sending File to IPFS: ")
        console.log(error)
    }

}

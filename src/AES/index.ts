import fs from "fs";
import { EAS, Offchain, SchemaEncoder, SchemaRegistry } from "@ethereum-attestation-service/eas-sdk";
import { v4 as uuid } from 'uuid';
import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();
//import notaryAbi from '../AES/notary.json'

//BigInt.prototype.toJSON = function () { return this.toString() };


export const EASContractAddress = "0xC2679fBD37d54388Ce493F1DB75320D236e1815e"; // Sepolia v0.26

export const singer = async ( pdf: Buffer) => {

    // Initialize the sdk with the address of the EAS Schema contract address
    const eas = new EAS(EASContractAddress);

    // Gets a default provider (in production use something else like infura/alchemy)
    
    const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RCP!)

    // Connects an ethers style provider/signingProvider to perform read/write functions.
    // MUST be a signer to do write operations!
    eas.connect(provider);

    const offchain = await eas.getOffchain();

    const pdfContent = pdf;
    const hash = ethers.keccak256(pdfContent);

    // Generar un UUID
    let docIduuid = uuid();
    docIduuid = docIduuid.replace(/-/g, '').substring(0, 31);
    console.log('UUID:', docIduuid);

    // Convertir el UUID en bytes32
    const bytes32UUID = ethers.encodeBytes32String(docIduuid);


    // Aplicar la función de hash keccak256
    const docId = ethers.keccak256(bytes32UUID);

    // Initialize SchemaEncoder with the schema string
    const schemaEncoder = new SchemaEncoder("bytes32 documentHash,bytes32 documentID");
    const encodedData = schemaEncoder.encodeData([
        { name: "documentHash", value: hash, type: "bytes32" },
        { name: "documentID", value: docId, type: "bytes32" },
    ]);

    // Signer is an ethers.js Signer instance
    const privateKey = process.env.PRIVATE_KEY!;
    const signer = new ethers.Wallet(privateKey, provider);

    const currentTimestampInSeconds = Math.floor(Date.now() / 1000); // Obtiene el timestamp actual en segundos

    const offchainAttestation = await offchain.signOffchainAttestation({
        recipient: '0xFD50b031E778fAb33DfD2Fc3Ca66a1EeF0652165',
        // Unix timestamp of when attestation expires. (0 for no expiration)
        expirationTime: BigInt("0"),
        // Unix timestamp of current time
        time: BigInt(currentTimestampInSeconds),
        revocable: true,
        version: 1,
        nonce: BigInt("0"),
        schema: "0xfdbbe4069e05af413cf64981da35a58a487df6a52defea9b6754434c1c065337",
        refUID: '0x0000000000000000000000000000000000000000000000000000000000000000',
        data: encodedData,
      }, signer);

      return offchainAttestation;
      
      /*
      let metadata = {
        "title": "Token Metadata",
        "type": "object",
        "properties": {
          "name": {
            "type": "string",
            "description": "Identifies the asset to which this token represents"
          },
          "description": {
            "type": "string",
            "description": "Describes the asset to which this token represents"
          },
          "file_url": {
            "type": "string",
            "description": "A URI pointing to a resource with mime type image/* representing the asset to which this token represents. Consider making any images at a width between 320 and 1080 pixels and aspect ratio between 1.91:1 and 4:5 inclusive."
          },
          "certificate_EAS": {
            "type": "object",
            "description": offchainAttestation
          }
        }
      }
      
      const url_metadata = `data:application/json;base64,${JSON.stringify(metadata)}`
      
      const contract = new ethers.Contract(process.env.CONTRACT_NOTARY!, notaryAbi, signer)
      
      const nft  = await contract.safeMint('0xFD50b031E778fAb33DfD2Fc3Ca66a1EeF0652165', url_metadata);
      
      return nft;
      */
      
}

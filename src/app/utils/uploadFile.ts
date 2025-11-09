// import { S3Client, PutObjectCommand, PutObjectCommandInput } from "@aws-sdk/client-s3";
// import { v4 as uuidv4 } from "uuid";
// import config from '../../config';

// // Initialize the S3 client for DigitalOcean Spaces
// const s3Client = new S3Client({
//   endpoint: process.env.DO_SPACE_ENDPOINT,
//   region: "nyc3", // DigitalOcean Spaces uses nyc3 as region
//   credentials: {
//     accessKeyId: process.env.DO_SPACE_ACCESS_KEY!,
//     secretAccessKey: process.env.DO_SPACE_SECRET_KEY!,
//   },
// });

// interface UploadFileResponse {
//   success: boolean;
//   url?: string;
//   error?: string;
// }

// export const uploadFile = async (file: Express.Multer.File): Promise<UploadFileResponse> => {
//   try {
//     if (!file) {
//       return { success: false, error: "No file provided" };
//     }

//     // Generate unique filename
//     const fileExtension = file.originalname.split(".").pop();
//     const fileName = `files/${uuidv4()}.${fileExtension}`;

//     // Define the upload parameters
//     const uploadParams: PutObjectCommandInput = {
//       Bucket: process.env.DO_SPACE_BUCKET,
//       Key: fileName,
//       Body: file.buffer,
//       ContentType: file.mimetype,
//       ACL: 'public-read',
//     };

//     // Upload the file to the Space
//     const command = new PutObjectCommand(uploadParams);
    
//     try {
//       await s3Client.send(command);

//       // Generate public URL
//       const imageUrl = `${process.env.DO_SPACE_ENDPOINT}/${process.env.DO_SPACE_BUCKET}/${fileName}`;

//       return {
//         success: true,
//         url: imageUrl,
//       };
//     } catch (uploadError) {
//       console.error("Error uploading image:", uploadError);
//       return {
//         success: false,
//         error: `DigitalOcean Spaces upload failed: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`,
//       };
//     }
//   } catch (error) {
//     console.error("Unexpected error in uploadImage:", error);
//     return {
//       success: false,
//       error: "Failed to upload image",
//     };
//   }
// };





import { S3Client, PutObjectCommand, PutObjectCommandInput } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import config from "../../config";

const s3Client = new S3Client({
  endpoint: config.do_space.endpoint,
  region: config.do_space.region,
  credentials: {
    accessKeyId: config.do_space.access_key,
    secretAccessKey: config.do_space.secret_key,
  },
});

interface UploadFileResponse {
  success: boolean;
  url?: string;
  error?: string;
}

export const uploadFile = async (file: Express.Multer.File): Promise<UploadFileResponse> => {
  try {
    if (!file) {
      return { success: false, error: "No file provided" };
    }

    const fileExtension = file.originalname.split(".").pop();
    const fileName = `files/${uuidv4()}.${fileExtension}`;

    const uploadParams: PutObjectCommandInput = {
      Bucket: config.do_space.bucket,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: "public-read",
    };

    await s3Client.send(new PutObjectCommand(uploadParams));

    const imageUrl = `${config.do_space.endpoint}/${config.do_space.bucket}/${fileName}`;
    return { success: true, url: imageUrl };
  } catch (error) {
    console.error("Error uploading image:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

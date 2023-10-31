import { Router } from "express";
import { IUserData } from "../common/interfaces";
import { OverlapColors } from "../common/enumerations";
import {
    badRequestResponse,
    internalServerErrorResponse,
    okResponse,
} from "../common/responses";
import { authorizationMiddleware } from "../middleware/auth-check";
import { PngPageOutput, pdfToPng } from "pdf-to-png-converter";
import { s3Client } from "../config/s3";
import {
    DeleteObjectsCommand,
    PutObjectCommand,
    ListObjectsCommand,
    GetObjectCommand,
} from "@aws-sdk/client-s3";
import multer from "multer";
import {
    getAffineTransform,
    imdecode,
    imencode,
    Point2,
    Vec3,
} from "@u4/opencv4nodejs";

const pdfRouter = Router();
const upload = multer();
const bucketName = "pdf-s3-bucket";

pdfRouter.use("/upload", authorizationMiddleware);
pdfRouter.post("/upload", upload.single("file"), async (req: any, res) => {
    try {
        if (req.body) {
            const file = req.file;
            const { filename } = req.body;
            const filenameWithoutExtension =
                getFileNameWithoutExtension(filename);
            const email: IUserData = req.user.email;

            const fileParams = {
                Bucket: bucketName, // Replace with your S3 bucket name
                Key: `${email}/${filenameWithoutExtension}/${filename}`, // Replace with your desired S3 object key
                Body: file.buffer,
            };

            const pngPages: PngPageOutput[] = await pdfToPng(
                file.buffer, // The function accepts PDF file path or a Buffer
                {
                    disableFontFace: true, // When `false`, fonts will be rendered using a built-in font renderer that constructs the glyphs with primitive path commands. Default value is true.
                    useSystemFonts: true, // When `true`, fonts that aren't embedded in the PDF document will fallback to a system font. Default value is false.
                    enableXfa: false, // Render Xfa forms if any. Default value is false.
                    viewportScale: 2.0, // The desired scale of PNG viewport. Default value is 1.0.
                    outputFileMask: "buffer", // Output filename mask. Default value is 'buffer'.
                    pagesToProcess: [1], // Subset of pages to convert (first page = 1), other pages will be skipped if specified.
                    strictPagesToProcess: false, // When `true`, will throw an error if specified page number in pagesToProcess is invalid, otherwise will skip invalid page. Default value is false.
                    verbosityLevel: 0, // Verbosity level. ERRORS: 0, WARNINGS: 1, INFOS: 5. Default value is 0.
                }
            );

            const imageParams = {
                Bucket: bucketName, // Replace with your S3 bucket name
                Key: `${email}/${filenameWithoutExtension}/${filenameWithoutExtension}.png`, // Replace with your desired S3 object key
                Body: pngPages[0].content,
            };

            await s3Client.send(new PutObjectCommand(imageParams));
            await s3Client.send(new PutObjectCommand(fileParams));
        } else {
            return badRequestResponse(res, { message: "Invalid PDF data" });
        }

        return okResponse(res, {});
    } catch (error) {
        console.error("Error", error);
        return internalServerErrorResponse(res, error);
    }
});

pdfRouter.use("/delete", authorizationMiddleware);
pdfRouter.post("/delete", async (req: any, res) => {
    try {
        const { filename } = req.body;
        const filenameWithoutExtension = getFileNameWithoutExtension(filename);
        const { email } = req.user;

        const deleteCommand = new DeleteObjectsCommand({
            Bucket: "pdf-s3-bucket", // Replace with your S3 bucket name
            Delete: {
                Objects: [
                    {
                        Key: `${email}/${filenameWithoutExtension}/${filename}.pdf`,
                    },
                    {
                        Key: `${email}/${filenameWithoutExtension}/${filenameWithoutExtension}.png`,
                    },
                ],
            },
        });

        await s3Client.send(deleteCommand);

        return okResponse(res, {});
    } catch (error) {
        console.error("Error", error);
        return internalServerErrorResponse(res, error);
    }
});

pdfRouter.use("/userPdfs", authorizationMiddleware);
pdfRouter.get("/userPdfs", async (req: any, res) => {
    const { email } = req.user;

    const listCommand = new ListObjectsCommand({
        Bucket: bucketName,
        Prefix: `${email}/`,
    });

    try {
        const response = await s3Client.send(listCommand);

        let fileNames = new Set<string>([]);
        response.Contents?.forEach((file) => {
            const fileName = file.Key?.split("/")[1];
            if (fileName) {
                fileNames.add(fileName);
            }
        });

        let result = new Map<string, string>();

        for (const fileName of fileNames) {
            const getCommand = new GetObjectCommand({
                Bucket: bucketName,
                Key: `${email}/${fileName}/${fileName}.png`,
            });

            const fileResponse = await s3Client.send(getCommand);

            const imageBuffer =
                await fileResponse.Body?.transformToString("base64");
            const dataUrl = `data:image/png;base64,${imageBuffer}`;

            result.set(fileName, dataUrl);
        }

        return okResponse(res, [...result]);
    } catch (error) {
        console.error("Error", error);
        return internalServerErrorResponse(res, error);
    }
});

pdfRouter.use("/transform", authorizationMiddleware);
pdfRouter.post("/transform", async (req: any, res) => {
    const { email } = req.user;
    const { basePoints, imagePoints, image, color } = req.body;
    const { red, blue, green } = JSON.parse(color);

    const getCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: `${email}/${image}/${image}.png`,
    });

    const fileResponse = await s3Client.send(getCommand);

    const imageData = await fileResponse.Body?.transformToString("base64");

    if (!imageData) {
        return badRequestResponse(res, { message: "Pdf data was not found" });
    }

    const imageBuffer = Buffer.from(imageData, "base64");

    const baseProccessedPoints: Point2[] = JSON.parse(basePoints).map(
        (point: { x: number; y: number }) => new Point2(point.x, point.y)
    );

    const imageProccessedPoints: Point2[] = JSON.parse(imagePoints).map(
        (point: { x: number; y: number }) => new Point2(point.x, point.y)
    );

    const matrix = getAffineTransform(
        imageProccessedPoints,
        baseProccessedPoints
    );

    const imageMat = imdecode(imageBuffer);

    const notWhiteColor = imageMat.inRange(
        new Vec3(0, 0, 0),
        new Vec3(254, 254, 254)
    );

    imageMat.setTo(new Vec3(blue, green, red), notWhiteColor);

    const transformedImage = imageMat.warpAffine(matrix);

    const blackPixelsMask = transformedImage.inRange(
        new Vec3(0, 0, 0),
        new Vec3(1, 1, 1)
    );
    transformedImage.setTo(new Vec3(255, 255, 255), blackPixelsMask);

    const processedBuffer = imencode(".png", transformedImage).toString(
        "base64"
    );

    const imageUrl = `data:image/png;base64,${processedBuffer}`;

    return okResponse(res, { imageUrl: imageUrl });
});

export default pdfRouter;

function getFileNameWithoutExtension(filename: string): string {
    return filename.split(".")[0];
}

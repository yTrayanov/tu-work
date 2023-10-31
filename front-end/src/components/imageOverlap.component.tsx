import { useEffect, useRef, useState } from "react";
import { Color, ImageState, Point } from "../common/interfaces";
import { OverlapColors } from "../common/enumerations";
import axios from "axios";
import { Card, Container, Input, Label, Row } from "reactstrap";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

interface Props {
    images: Map<string, ImageState>;
    imagesPoints: Map<string, Point[]>;
    refreshImages: () => void;
}

const ImageOverlayComponent: React.FC<Props> = ({
    images,
    imagesPoints,
    refreshImages,
}) => {
    const pdfContainerRef = useRef(null);

    const [baseImage, setBaseImage] = useState<{
        pdfName: string;
        state: ImageState;
    } | null>(null);

    const [overlapImages, setOverlapImages] = useState<Map<string, ImageState>>(
        new Map()
    );

    const [isSaving, setIsSaving] = useState(false);
    const [overlapPdfName, setOverlapPdfName] = useState("");

    useEffect(() => {
        let foundBaseImage = false;
        for (const [key, value] of images) {
            if (value.isBase) {
                setBaseImage({ pdfName: key, state: value });
                foundBaseImage = true;
                break;
            }
        }

        if (!foundBaseImage && baseImage) setBaseImage(null);

        setOverlapImages(images);
    }, [images]);

    const transformImages = async () => {
        let tempMap = new Map<string, ImageState>(overlapImages);
        if (!baseImage) {
            return;
        }
        const basePoints = imagesPoints.get(baseImage?.pdfName);

        let indexColor = 0;
        let color: Color = { red: 255, blue: 0, green: 0 };

        for (const [key, value] of overlapImages) {
            if (baseImage && !value.isBase && basePoints) {
                const pointsToTransform = imagesPoints.get(key);

                if (
                    basePoints.length === 3 &&
                    pointsToTransform?.length === 3
                ) {
                    if (indexColor === 1) {
                        color = { red: 0, blue: 0, green: 255 };
                    } else if (indexColor === 2) {
                        color = { red: 0, blue: 255, green: 0 };
                    }
                    indexColor++;

                    const requestData = {
                        image: key,
                        basePoints: JSON.stringify(basePoints),
                        imagePoints: JSON.stringify(pointsToTransform),
                        color: JSON.stringify(color),
                    };

                    const { data } = await axios.post(
                        "http://localhost:5000/pdf/transform",
                        requestData
                    );

                    tempMap.set(key, {
                        ...value,
                        imageUrl: data.imageUrl,
                    });
                }
            }
        }

        setOverlapImages(tempMap);
    };

    const toggleSave = () => {
        if (overlapImages && baseImage) {
            setIsSaving((prev) => !prev);
        }
    };

    const savePdf = async () => {
        if (pdfContainerRef.current) {
            const pdf = new jsPDF();

            const canvas = await html2canvas(pdfContainerRef.current);
            const imageData = canvas.toDataURL("image/png");

            pdf.setFillColor(255, 255, 255); // Set fill color to white
            pdf.rect(0, 0, 250, 250, "F"); // Fill the entire page with white
            pdf.addImage(imageData, "PNG", 10, 10, 190, 250);

            const pdfBuffer = pdf.output("arraybuffer");

            const formData = new FormData();
            formData.append(
                "file",
                new Blob([pdfBuffer], { type: "application/pdf" })
            );
            formData.append("filename", `${overlapPdfName}.pdf`);

            const response = await axios.post(
                "http://localhost:5000/pdf/upload", // Replace with your Lambda API endpoint
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            if (response.status === 200) {
                refreshImages();
                toggleSave();
            }
        }
    };

    const onPdfNameChange = (e: any) => {
        setOverlapPdfName(e.target.value);
    };

    const renderImages = () => {
        return Array.from(overlapImages).map(([key, value], index) => {
            if (!value.isBase) {
                return (
                    <img
                        key={index}
                        className="image overlay"
                        src={value.imageUrl}
                        alt="overlay"
                    />
                );
            }
        });
    };

    return (
        <Container id="alignPopup">
            {baseImage && (
                <div id="overlap-controls">
                    <div>
                        <button onClick={transformImages} id="align-button">
                            Align
                        </button>
                        <button onClick={toggleSave} id="savePdf">
                            Save
                        </button>
                    </div>
                </div>
            )}

            {isSaving && (
                <div id="save-overlap-popup">
                    <div>
                        <Label for="pdf-name">Enter pdf name</Label>
                        <Input
                            name="pdf-name"
                            type="text"
                            onChange={onPdfNameChange}
                            required
                            value={overlapPdfName}
                        />
                    </div>
                    <div>
                        <button onClick={savePdf}>Save</button>
                        <button onClick={toggleSave}>Cancel</button>
                    </div>
                </div>
            )}
            {overlapImages && baseImage && (
                <Card>
                    <Row>
                        <div className="image-overlay-popup">
                            <div className="images-container">
                                <div
                                    className="image-container"
                                    ref={pdfContainerRef}
                                >
                                    <img
                                        className="image"
                                        src={baseImage.state.imageUrl}
                                        alt="base"
                                    />
                                    {renderImages()}
                                </div>
                            </div>
                        </div>
                    </Row>
                </Card>
            )}
        </Container>
    );
};

export default ImageOverlayComponent;

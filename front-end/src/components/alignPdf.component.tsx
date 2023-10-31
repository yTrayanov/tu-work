import { useEffect, useState } from "react";
import { Col, Container, Row } from "reactstrap";
import axios from "axios";
import InteractiveImage from "./interactiveImage.component";
import { Point, ImageState, IImage } from "../common/interfaces";
import ImageOverlayComponent from "./imageOverlap.component";
import PdfSideMenu from "./pdfSideMenu.component";
import { useNavigate } from "react-router-dom";

const AlignPdfComponent = () => {
    const navigate = useNavigate();

    const [images, setImages] = useState<Map<string, ImageState>>(new Map());
    const [imagesPoints, setImagesPoints] = useState<Map<string, Point[]>>(
        new Map()
    );

    const [overlapImages, setOverlapImages] = useState<Map<string, ImageState>>(
        new Map()
    );

    const [currentImage, setCurrentImage] = useState<IImage>();

    useEffect(() => {
        if (!sessionStorage.getItem("token")) {
            navigate("/login");
        }

        refreshPdfData();
    }, []);

    const refreshPdfData = () => {
        if (axios.defaults.headers.common["Authorization"]) {
            axios.get("http://localhost:5000/pdf/userPdfs").then(({ data }) => {
                const tempMap = new Map<string, ImageState>();

                for (const imageData of data) {
                    tempMap.set(imageData[0], {
                        imageUrl: imageData[1],
                        isChecked: false,
                        isBase: false,
                    });
                }
                setImages(tempMap);
            });
        }
    };

    const changeCurrentImage = async (pdfName: string) => {
        const image = images.get(pdfName);

        if (image) {
            setCurrentImage({
                imageName: pdfName,
                imageUrl: image.imageUrl,
            });
        }
    };

    const removeAddOverlapImage = (pdfName: string, isChecked: boolean) => {
        const allImages = images.get(pdfName);
        const overlapImage = overlapImages.get(pdfName);

        let image: ImageState;

        if (allImages) image = allImages;
        else if (overlapImage) image = overlapImage;
        else return;

        if (isChecked) {
            if (Array.from(overlapImages).length === 3) return;

            setOverlapImages((prev) => {
                const tempMap = new Map(prev);

                tempMap.set(pdfName, image);

                return tempMap;
            });

            setImages((prev) => {
                const tempMap = new Map(prev);
                tempMap.set(pdfName, {
                    ...image,
                    isChecked: isChecked,
                    isBase: false,
                });
                return tempMap;
            });
        } else {
            setImagesPoints((prev) => {
                const tempMap = new Map(prev);

                tempMap.delete(pdfName);
                return tempMap;
            });

            setImages((prev) => {
                const tempMap = new Map(prev);

                if (tempMap.has(pdfName)) {
                    tempMap.set(pdfName, {
                        ...image,
                        isChecked: isChecked,
                        isBase: false,
                    });
                }

                return tempMap;
            });

            setOverlapImages((prev) => {
                const tempMap = new Map(prev);
                tempMap.delete(pdfName);

                return tempMap;
            });

            setImagesPoints((prev) => {
                const tempMap = new Map(prev);
                tempMap.delete(pdfName);

                return prev;
            });

            if (currentImage?.imageName === pdfName) {
                let foundDifferentImage = false;
                for (const [key, value] of overlapImages?.entries()) {
                    if (key !== pdfName && value.isChecked) {
                        setCurrentImage({
                            imageName: key,
                            imageUrl: value.imageUrl,
                        });

                        foundDifferentImage = true;
                        break;
                    }
                }

                if (!foundDifferentImage) setCurrentImage(undefined);
            }
        }
    };

    const changeBaseImage = (pdfName: string) => {
        setOverlapImages((prev) => {
            let tempMap = new Map(prev);
            const dataToChange = tempMap.get(pdfName);

            if (dataToChange) {
                for (const [key, value] of overlapImages) {
                    tempMap.set(key, { ...value, isBase: false });
                }

                tempMap.set(pdfName, { ...dataToChange, isBase: true });
            }

            return tempMap;
        });
    };

    const CheckForOverlap = () => {
        return Array.from(overlapImages.entries()).length > 0;
    };

    return (
        <Container fluid>
            <Row>
                <Col md={2}>
                    <PdfSideMenu
                        images={images}
                        changeCurrentImage={changeCurrentImage}
                        removeAddOverlapImage={removeAddOverlapImage}
                        changeBaseImage={changeBaseImage}
                        refreshImageData={refreshPdfData}
                        overlapImages={overlapImages}
                    />
                </Col>
                <Col md={5}>
                    {currentImage && (
                        <InteractiveImage
                            image={currentImage}
                            setPoints={setImagesPoints}
                            points={imagesPoints.get(currentImage.imageName)}
                        />
                    )}
                </Col>
                <Col md={5}>
                    {CheckForOverlap() && (
                        <ImageOverlayComponent
                            images={overlapImages}
                            imagesPoints={imagesPoints}
                            refreshImages={refreshPdfData}
                        />
                    )}
                </Col>
            </Row>
        </Container>
    );
};

export default AlignPdfComponent;

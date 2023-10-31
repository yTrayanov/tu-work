import React, { useRef, useState } from "react";
import { IImage, Point } from "../common/interfaces";
import { Card, Container, Row } from "reactstrap";

interface InteractiveImageProps {
    image: IImage;
    setPoints: any;
    points?: Point[];
}

const InteractiveImage: React.FC<InteractiveImageProps> = ({
    image,
    points,
    setPoints,
}) => {
    const imageElementRef = useRef<HTMLImageElement>(null);
    const [scale, setScale] = useState({ x: 1, y: 1 });

    const handleImageClick = (event: React.MouseEvent<HTMLImageElement>) => {
        const { clientX, clientY } = event;
        const imageElement = event.currentTarget;
        const container = imageElement.parentElement; // Get the parent container
        const imageRect = imageElement?.getBoundingClientRect(); // Get the container's position

        const scaleX = imageElement.naturalWidth / imageElement.width;
        const scaleY = imageElement.naturalHeight / imageElement.height;

        setScale({ x: scaleX, y: scaleY });

        if (container && imageRect) {
            const x =
                (clientX - imageRect.left + imageElement.scrollLeft) * scaleX;
            const y =
                (clientY - imageRect.top + imageElement.scrollTop) * scaleY;

            setPoints((prevPoints: Map<string, Point[]>) => {
                let newMap = new Map(prevPoints);

                if (!points) {
                    newMap.set(image.imageName, [{ x, y }]);
                } else if (points.length < 3) {
                    newMap.set(image.imageName, [...points, { x, y }]);
                } else {
                    newMap.set(image.imageName, []);
                }

                return newMap;
            });
        }
    };

    const renderPoints = () => {
        if (!points) return;

        const imageElement = imageElementRef.current;

        const container = imageElement?.parentElement;

        const containerRect = container?.getBoundingClientRect();
        const imageRect = imageElement?.getBoundingClientRect();

        if (!containerRect?.top || !imageRect?.top) return;

        const topOffset = imageRect?.top - containerRect?.top;
        const leftOffset = imageRect.left - containerRect.left;

        if (imageRect) {
            return points.map((point, index) => (
                <div
                    key={index}
                    className="point"
                    style={{
                        left: point.x / scale.x + leftOffset,
                        top: point.y / scale.y + topOffset,
                    }}
                />
            ));
        }
    };

    return (
        <Container>
            {image && (
                <Card>
                    <Row>
                        <div className="images-container">
                            <div className="image-container">
                                <img
                                    className="image"
                                    src={image.imageUrl}
                                    alt="Interactive"
                                    onClick={handleImageClick}
                                    ref={imageElementRef}
                                />
                                {renderPoints()}
                            </div>
                        </div>
                    </Row>
                </Card>
            )}
        </Container>
    );
};

export default InteractiveImage;

import {
    faTrash,
    faX,
    faFileArrowUp,
    faFloppyDisk,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import axios from "axios";
import { ChangeEvent, Fragment, useEffect, useState } from "react";
import { Col, Container, ListGroup, ListGroupItem, Row } from "reactstrap";
import { ImageState } from "../common/interfaces";

interface PdfSideMenuProps {
    images: Map<string, ImageState>;
    overlapImages: Map<string, ImageState>;
    removeAddOverlapImage: (name: string, isChecked: boolean) => void;
    changeCurrentImage: (name: string) => void;
    changeBaseImage: (name: string) => void;
    refreshImageData: () => void;
}

export default function PdfSideMenu({
    images,
    removeAddOverlapImage,
    changeCurrentImage,
    changeBaseImage,
    refreshImageData,
    overlapImages,
}: PdfSideMenuProps) {
    const deletePdf = async (filename: string) => {
        const response = await axios.post(
            "http://localhost:5000/pdf/delete",
            {
                filename: filename,
            },
            {
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );

        if (response.status === 200) {
            refreshImageData();
        }
    };

    const handleCheckboxClick = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const checked = event.target.checked;
        const pdfName = event.target.getAttribute("data-name");

        if (pdfName) {
            removeAddOverlapImage(pdfName, checked);
        }
    };

    const handleOverlapBaseImageCheckbox = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const pdfName = event.target.getAttribute("data-name");

        if (pdfName) changeBaseImage(pdfName);
    };

    const uploadFile = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];

        if (file && file.type === "application/pdf") {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("filename", file.name);

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
                refreshImageData();
            }
        }
    };

    return (
        <div id="side-bar-pdf">
            <ListGroup className="side-bar-list">
                <ListGroupItem id="pdf-list-controls">
                    <label className="custom-file-input">
                        <input
                            type="file"
                            accept="application/pdf"
                            onChange={uploadFile}
                        />
                        <FontAwesomeIcon icon={faFileArrowUp} />
                    </label>
                </ListGroupItem>
                {Array.from(images).length > 0 &&
                    Array.from(images).map(([key, value], index) => (
                        <ListGroupItem key={index}>
                            <Row>
                                <Col md={8} className="sidebar-list-item ">
                                    {key}
                                </Col>
                                <Col md={2}>
                                    <input
                                        type="checkbox"
                                        data-name={key}
                                        onChange={handleCheckboxClick}
                                        checked={overlapImages.has(key)}
                                    />
                                </Col>
                                <Col
                                    md={2}
                                    className="delete-list-item"
                                    onClick={() => deletePdf(key)}
                                >
                                    <FontAwesomeIcon icon={faTrash} />
                                </Col>
                            </Row>
                        </ListGroupItem>
                    ))}
            </ListGroup>
            <ListGroup className="side-bar-list">
                {Array.from(overlapImages).length > 0 &&
                    Array.from(overlapImages).map(([key, value], index) => (
                        <ListGroupItem key={index}>
                            <Row>
                                <Col
                                    md={8}
                                    className="sidebar-list-item "
                                    onClick={() => changeCurrentImage(key)}
                                >
                                    {key}
                                </Col>
                                <Col md={2}>
                                    <input
                                        type="checkbox"
                                        data-name={key}
                                        onChange={
                                            handleOverlapBaseImageCheckbox
                                        }
                                        checked={value.isBase}
                                    />
                                </Col>
                                <Col
                                    md={2}
                                    className="delete-list-item"
                                    onClick={() =>
                                        removeAddOverlapImage(key, false)
                                    }
                                >
                                    <FontAwesomeIcon icon={faX} />
                                </Col>
                            </Row>
                        </ListGroupItem>
                    ))}
            </ListGroup>
        </div>
    );
}

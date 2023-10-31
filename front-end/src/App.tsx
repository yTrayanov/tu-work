import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import { Container, Card, CardBody } from "reactstrap";
import { Routes, Route, BrowserRouter as Router } from "react-router-dom";
import AlignPdfComponent from "./components/alignPdf.component";
import RegisterComponent from "./components/auth/register.component";
import LoginComponent from "./components/auth/login.component";
import Navigation from "./components/navigation.component";
import axios from "axios";
import { Fragment, useEffect } from "react";

function App() {
    useEffect(() => {
        const token = sessionStorage.getItem("token");
        if (token) {
            axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        }
    }, []);

    return (
        <div>
            <Navigation />
            <Fragment>
                <Routes>
                    <Route path="/" element={<AlignPdfComponent />} />
                    <Route path="/login" element={<LoginComponent />} />
                    <Route path="/register" element={<RegisterComponent />} />
                </Routes>
            </Fragment>
        </div>
    );
}

export default App;

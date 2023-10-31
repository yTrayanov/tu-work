import axios from "axios";
import { Navbar, NavbarBrand, Nav, NavItem, NavLink } from "reactstrap";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

const Navigation = () => {
    const token = sessionStorage.getItem("token");
    const navigate = useNavigate();
    const [isLogged, setLogged] = useState(token ? true : false);

    const logout = async () => {
        if (token) {
            sessionStorage.setItem("token", "");
            await axios.post("http://localhost:5000/auth/logout");
            setLogged(false);

            navigate("/");
        }
    };

    useEffect(() => {
        setLogged(sessionStorage.getItem("token") ? true : false);
    }, [sessionStorage.getItem("token")]);

    return (
        <div>
            <Navbar id="navigation">
                <NavbarBrand>Pdf Viewer</NavbarBrand>
                {isLogged ? (
                    <Nav>
                        <NavItem>
                            <NavLink onClick={logout}>Logout</NavLink>
                        </NavItem>
                    </Nav>
                ) : (
                    <Nav>
                        <NavItem>
                            <NavLink href="/login">Login</NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink href="/register">Register</NavLink>
                        </NavItem>
                    </Nav>
                )}
            </Navbar>
        </div>
    );
};

export default Navigation;

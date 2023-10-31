import axios, { AxiosResponse } from "axios";
import React, { useEffect, useState } from "react";
import { Form, Input, FormGroup, Label, Button } from "reactstrap";
import { useNavigate } from "react-router-dom";

const LoginComponent = () => {
    const navigate = useNavigate();

    const [loginData, setLoginData] = useState({
        email: "user1@user.bg",
        password: "pass123",
    });

    useEffect(() => {
        const token = sessionStorage.getItem("token");

        if (token) {
            navigate("/");
        }
    }, []);

    const onChange = (e: any) => {
        setLoginData({ ...loginData, [e.target.name]: e.target.value });
    };

    const login = async (e: React.FormEvent) => {
        e.preventDefault();

        const response = await axios
            .post("http://localhost:5000/auth/login", loginData)
            .catch((error) => {
                console.log("Invalid Credentials");
            });

        const { status, data } = response as AxiosResponse;

        if (status === 200) {
            sessionStorage.setItem("token", data.token);
            axios.defaults.headers.common[
                "Authorization"
            ] = `Bearer ${data.token}`;
            navigate("/");
        }
    };

    return (
        <div>
            <Form onSubmit={login}>
                <FormGroup>
                    <Label for="email">Email</Label>
                    <Input
                        name="email"
                        type="email"
                        onChange={onChange}
                        required
                        value={loginData.email}
                    />
                </FormGroup>
                <FormGroup>
                    <Label for="password">Password</Label>
                    <Input
                        name="password"
                        type="password"
                        onChange={onChange}
                        required
                        value={loginData.password}
                    />
                </FormGroup>
                <Button type="submit">Sign in</Button>
            </Form>
        </div>
    );
};

export default LoginComponent;

import axios, { AxiosResponse } from "axios";
import React, { useEffect, useState } from "react";
import { Form, Input, FormGroup, Label, Button } from "reactstrap";
import { useNavigate } from "react-router-dom";

const LoginComponent = () => {
    const navigate = useNavigate();

    const [registerData, setRegisterData] = useState({
        email: "",
        password: "",
        confirmPassword: "",
    });

    const onChange = (e: any) => {
        setRegisterData({ ...registerData, [e.target.name]: e.target.value });
    };

    const register = async (e: React.FormEvent) => {
        e.preventDefault();

        const { email, password, confirmPassword } = registerData;

        if (password === confirmPassword) {
            const response = await axios
                .post("http://localhost:5000/auth/register", {
                    email: registerData.email,
                    password: registerData.password,
                })
                .catch((error) => {
                    console.log("Invalid Credentials");
                });
            const { status } = response as AxiosResponse;
            if (status === 200) {
                navigate("/login");
            }
        }
    };

    return (
        <div>
            <Form onSubmit={register}>
                <FormGroup>
                    <Label for="email">Email</Label>
                    <Input
                        name="email"
                        type="email"
                        onChange={onChange}
                        required
                        value={registerData.email}
                    />
                </FormGroup>
                <FormGroup>
                    <Label for="password">Password</Label>
                    <Input
                        name="password"
                        type="password"
                        onChange={onChange}
                        required
                        value={registerData.password}
                    />
                </FormGroup>
                <FormGroup>
                    <Label for="confirmPassword">Confirm Password</Label>
                    <Input
                        name="confirmPassword"
                        type="password"
                        onChange={onChange}
                        required
                        value={registerData.confirmPassword}
                    />
                </FormGroup>
                <Button type="submit">Register</Button>
            </Form>
        </div>
    );
};

export default LoginComponent;
